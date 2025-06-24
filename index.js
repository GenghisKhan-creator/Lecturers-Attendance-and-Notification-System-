import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import session from "express-session";
import { dirname } from "path";
import { fileURLToPath } from "url";
import nodemailer from 'nodemailer';
import { sendEmail } from "./emailUtil.js";
import cors from 'cors';
import dotenv from 'dotenv'

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const port = 3000; 
const saltRounds = 10;

app.use(
    session({
      secret: process.env.SESSION_PASSWORD,
      resave: false,
      saveUninitialized: true,
    })
);

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json());

app.use(passport.initialize());
app.use(passport.session());

const db = new pg.Client({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT,
    ssl: { rejectUnauthorized: false }
})

db.connect();

function checkArrivalTime(scheduledTime, arrivalTime, scheduledDate) {
  const [scheduledHours, scheduledMinutes, scheduledSeconds] = scheduledTime.split(':').map(Number);
  const scheduledDateTime = new Date(scheduledDate);
  scheduledDateTime.setHours(scheduledHours, scheduledMinutes, scheduledSeconds);

    const [arrivalHours, arrivalMinutes, arrivalSeconds] = arrivalTime.split(':').map(Number);
    const arrivalDateTime = new Date(scheduledDate);
    arrivalDateTime.setHours(arrivalHours, arrivalMinutes, arrivalSeconds);


  const differenceMs = arrivalDateTime.getTime() - scheduledDateTime.getTime();
  const differenceMinutes = differenceMs / (1000 * 60);

  if (differenceMinutes > 1) {
    return "late";
  } else {
    return "present";
  }
};

//Send notification function
function startAttendanceMonitor() {
  setInterval(async () => {
    const now = new Date();
    console.log(now);
    const currentTime = now.toTimeString().split(" ")[0]; // "HH:MM:SS"
    console.log(currentTime);
    const currentDate = now.toISOString().split("T")[0]; // "YYYY-MM-DD"

    console.log("Attendance monitor check at", currentTime);

    try {
      // Get all schedules for the current date
      const { rows: schedules } = await db.query(`
        SELECT * FROM users INNER JOIN schedule ON users.id = schedule.user_id WHERE date = $1
      `, [currentDate]);

      for (const schedule of schedules) {
        const userId = schedule.user_id;
        const course = schedule.course;
        const startTime = schedule.start_time;
        const closingTime = schedule.end_time;
        const group_week = schedule.group_week;

        const lectureStart = new Date(`${currentDate}T${startTime}`);
        const lectureEnd = new Date(`${currentDate}T${closingTime}`);
        const timeToStart = (lectureStart - now) / (1000 * 60); // in minutes

        // Reminder logic: if the lecture starts in <=10 mins and > 0
        if (timeToStart <= 10 && timeToStart > 0) {
          await sendEmail(
            userId,
            `Reminder: Your ${group_week} lecture for ${course} starts in ${Math.round(timeToStart)} minutes.`
          );
        }

        // Absence logic: if current time is after lecture end and no attendance was submitted
        if (now > lectureEnd) {
          const { rows: attendanceCheck } = await db.query(`
            SELECT * FROM attendance WHERE user_id = $1 AND course = $2 AND week = $3 AND report_time IS NOT NULL
          `, [userId, course, currentDate]);

          if (attendanceCheck.length === 0) {
            await db.query(`
              INSERT INTO attendance (course, venue, level, group_week, week, report_time, closing_time, remarks, user_id, status)
              VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
            `, [
              course,
              schedule.venue,
              schedule.level,
              group_week,
              currentDate,
              null,
              closingTime,
              "No report submitted",
              userId,
              "Absent"
            ]);

            await sendEmail(userId, `You have been marked absent for ${course} (${group_week}). You didn’t report your attendance before the lecture ended.`);
          }
        }
      }
    } catch (error) {
      console.error("Error in attendance monitor:", error);
    }
  }, 8 * 60 * 1000); 
}


startAttendanceMonitor();
//end here

app.get("/", (req, res) => {
    res.render(__dirname+"/views/login.ejs");
});

app.get("/register", (req, res) => {
    res.render(__dirname+"/views/adminReg.ejs");
});

app.get("/lecturer", async (req, res) => {
    const user_id = req.user.id;
    const selectedUser = await db.query(
      "SELECT * FROM users INNER JOIN attendance ON users.id = attendance.user_id WHERE users.id = $1",
       [user_id]
      );
    const data = selectedUser.rows;
   

    let presentCount = data.length;

    let percentage = Math.floor((presentCount / 50) * 100);

    console.log(percentage);

    res.render(__dirname+"/views/lec_dashboard.ejs",{presentCount: presentCount, percentage:percentage,});
});

app.get("/admin", async (req, res) => {
  if (req.isAuthenticated()) {
    const selectedUser = await db.query("SELECT * FROM users INNER JOIN attendance ON users.id = attendance.user_id");
    const data = selectedUser.rows;
    console.log(data);

    const schedule = await db.query("SELECT * FROM schedule");
    const TotalScheduled = schedule.rows.length;

    const users = (await db.query("SELECT * FROM users")).rows;

    const totalLecturers = users.length - 1;

    let presentCount = 0;

    for (let i = 0; i < data.length; i++) {
      const entry = data[i]; // Get the current object in the array
      
      // Check if the 'status' property exists and its value is 'late'
      if (entry.status === 'present') {
          presentCount++; // Increment the counter
      }
    }

    let absentCount = 0;
    
    for (let i = 0; i < data.length; i++) {
      const entry = data[i]; // Get the current object in the array
      
      // Check if the 'status' property exists and its value is 'late'
      if (entry.status === 'late') {
          absentCount++; // Increment the counter
      }
    }

    let absentCountx = 0;

    for (let i = 0; i < data.length; i++) {
      const entry = data[i]; // Get the current object in the array
      
      // Check if the 'status' property exists and its value is 'late'
      if (entry.status === 'Absent') {
          absentCountx++; // Increment the counter
      }
    }

    let presentPercentage = Math.floor((presentCount / TotalScheduled) * 100);
    let absentPercentage = Math.floor((absentCount / TotalScheduled) * 100);
    let absentPercentagex = Math.floor((absentCountx / TotalScheduled) * 100);

    const recentEntries = [];
    for (let i = Math.max(0, data.length - 5); i < data.length; i++) {
      recentEntries.push(data[i]);
    }
    console.log("this is a recent entry")
    console.log(absentCountx);

  
    res.render(
    __dirname+"/views/admindash.ejs", {
      presentCount:presentCount, 
      absentCount:absentCount, 
      absentCountx: absentCountx,
      presentPercentage:presentPercentage, 
      absentPercentage:absentPercentage,
      absentPercentagex: absentPercentagex,
      totalLecturers:totalLecturers,
      recentEntries: recentEntries
    }
  );
  } else {
    res.redirect("/");
  }
});

app.get("/logout", (req, res) => {
    req.logout(function (err) {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    });
});

app.get("/attendance", (req, res) => {
  if (req.isAuthenticated()) {
    res.render(__dirname+"/views/newEntry.ejs");
  } else {
    res.redirect("/");
  }
})

app.get("/lecturers", async (req, res) => {
  if (req.isAuthenticated()) {
    const selectedUser = await db.query("SELECT * FROM users");
    const data = selectedUser.rows;
    res.render(__dirname+"/views/lecturersPanel.ejs", {lecturers: data});
  } else {
    res.redirect("/");
  }
})

app.get("/search", async (req, res) => {
  res.render(__dirname+"/views/search.ejs");
})

app.get("/schedule", async (req, res) => {
    const selectedUser = await db.query("SELECT * FROM users");
    const data = selectedUser.rows;
  res.render(__dirname+"/views/schedule.ejs", {lecturers: data});
})

app.get("/report", async (req, res) => {
  if (req.isAuthenticated()) {
    const selectedUser = await db.query("SELECT * FROM users INNER JOIN attendance ON users.id = attendance.user_id WHERE users.id = $1 ORDER BY attendance.id DESC", [req.user.id]);
    const data = selectedUser.rows;

    res.render(__dirname+"/views/report.ejs", {report: data});
  } else {
    res.redirect("/");
  }
  
})

app.get("/admin-report", (req, res) => {
  if (req.isAuthenticated()) {
    res.render(__dirname+"/views/admin_report.ejs");
  } else {
    res.redirect("/");
  }
})
  

// app.post("/",
//   passport.authenticate("local", {
//       successRedirect: "/lecturer",
//       failureRedirect: "/login",
//     })
// );

app.post("/", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.redirect("/");
    }

    req.login(user, (loginErr) => {
      if (loginErr) {
        return next(loginErr); 
      }

      if (user.id === 1) {
        return res.redirect("/admin"); 
      } else {
        return res.redirect("/lecturer");
      }
    });
  })(req, res, next); 
});

app.post("/attendance", async (req, res) => {
  if (req.isAuthenticated()) {
    const user_id = req.user.id;
    const courseTitle = req.body.course_title;
    const venue = req.body.venue;
    const closing_time = req.body.closing_time;
    const level = req.body.level;
    const group = req.body.group;
    const remarks = req.body.remarks;

    const now = new Date();
    const formattedTimeForDB = now.toISOString().split("T")[1].split(".")[0]; // "HH:MM:SS"
    const formattedDate = now.toISOString().split("T")[0]; // "YYYY-MM-DD"

    try {
      const scheduleResult = await db.query(
        `SELECT * FROM schedule 
         WHERE user_id = $1 
         AND date = $2 
         AND course = $3`,
        [user_id, formattedDate, courseTitle]
      );

      if (scheduleResult.rows.length === 0) {
  // Not scheduled for this course today — send error response
          return res.send(`
            <!DOCTYPE html>
            <html>
            <head>
              <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
            </head>
            <body>
              <script>
                Swal.fire({
                  icon: 'error',
                  title: 'Not Scheduled',
                  text: 'You do not have a class scheduled for today!',
                }).then(() => {
                  window.location.href = "/lecturer";
                });
              </script>
            </body>
            </html>
          `);
        }


      const schedule = scheduleResult.rows[0];
      const startTime = schedule.start_time;
      const reportDate = schedule.date;
      const status = checkArrivalTime(startTime, formattedTimeForDB, reportDate);

      await db.query(
        `INSERT INTO attendance 
         (course, venue, level, group_week, week, report_time, closing_time, remarks, user_id, status) 
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [courseTitle, venue, level, group, formattedDate, formattedTimeForDB, closing_time, remarks, user_id, status]
      );

      res.redirect("/lecturer");

    } catch (error) {
      console.error(error);
      res.status(500).send("Internal server error.");
    }
  } else {
    res.redirect("/login");
  }
});


app.post('/schedule', async (req, res) => {
  const inputUser = req.body.lecturer;
  const course_title = req.body.course_title;
  const group_week = req.body.group_week;
  const start_time = req.body.start_time;
  const closing_time = req.body.closing_time;
  const date = req.body.dateInput;

  console.log(`new date: ${date}`);

  try {
    const userSearch = await db.query("SELECT * FROM users WHERE users.username = $1", [inputUser]);
    const selectedUser = userSearch.rows;

    if (selectedUser.length === 0) {
      return res.send("User not found");
    }

    const user_id = selectedUser[0].id;

    await db.query(
      "INSERT INTO schedule (course, group_week, start_time, end_time, date, user_id) VALUES ($1, $2, $3, $4, $5, $6)",
      [course_title, group_week, start_time, closing_time, date, user_id]
    );

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
        </head>
        <body>
          <script>
            Swal.fire({
              icon: 'success',
              title: 'Schedule Added',
              text: 'The schedule was successfully added!',
              timer: 2000,
              showConfirmButton: false
            }).then(() => {
              window.location.href = "/admin";
            });
          </script>
        </body>
      </html>
    `);

  } catch (error) {
    console.log(error);
    res.status(500).send("Internal server error");
  }
});

app.post('/search', async (req, res) => {
  const userInput = req.body.search;

  try {
    const userSearch = await db.query(
      "SELECT * FROM users INNER JOIN attendance ON users.id = attendance.user_id WHERE users.username = $1",
      [userInput]
    );

    const userTable = userSearch.rows;

    if (userTable.length === 0) {
      // User not found — show SweetAlert and redirect to /admin
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
        </head>
        <body>
          <script>
            Swal.fire({
              icon: 'error',
              title: 'User Not Found',
              text: 'The username "${userInput}" does not exist or has no attendance records.',
            }).then(() => {
              window.location.href = "/admin";
            });
          </script>
        </body>
        </html>
      `);
    }

    // User found — render results
    res.render(__dirname + "/views/search.ejs", { searchResults: userTable });

  } catch (error) {
    console.error(error);
    res.status(500).send("Internal server error");
  }
});


app.post("/register", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const email = req.body.email;

    try {
        const checkResult = await db.query("SELECT * FROM users WHERE username = $1", [
          username,
        ]);
    
        if (checkResult.rows.length > 0) {
          req.redirect("/");
        } else {
          bcrypt.hash(password, saltRounds, async (err, hash) => {
            if (err) {
              console.error("Error hashing password:", err);
            } else {
              const result = await db.query(
                "INSERT INTO users (username, password, email) VALUES ($1, $2, $3) RETURNING *",
                [username, hash, email]
              );
              const user = result.rows[0];
              req.login(user, (err) => {
                console.log("success");
                res.redirect("/lecturer");
              });
            }
          });
        }
      } catch (err) {
        console.log(err);
      }
});

passport.use(
    "local",
    new Strategy(async function verify(username, password, cb) {
      try {
        const result = await db.query("SELECT * FROM users WHERE username = $1 ", [
          username,
        ]);
        if (result.rows.length > 0) {
          const user = result.rows[0];
          const storedHashedPassword = user.password;
          bcrypt.compare(password, storedHashedPassword, (err, valid) => {
            if (err) {
              //Error with password check
              console.error("Error comparing passwords:", err);
              return cb(err);
            } else {
              if (valid) {
                //Passed password check
                return cb(null, user);
              } else {
                //Did not pass password check
                return cb(null, false);
              }
            }
          });
        } else {
          return cb("User not found");
        }
      } catch (err) {
        console.log(err);
      }
    })
);

passport.serializeUser((user, cb) => {
  cb(null, user);
});
passport.deserializeUser((user, cb) => {
  cb(null, user);
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

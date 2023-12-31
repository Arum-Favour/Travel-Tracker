import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "AmbassadorKingson",
  port: 5432,
});

db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

async function checkVisited() {
  const result = await db.query("SELECT country_code FROM visited_countries");

  let checkedCountries = [];
  result.rows.forEach((country) => {
    checkedCountries.push(country.country_code);
  });
  return checkedCountries;
}

app.get("/", async (req, res) => {
  const checkedCountries = await checkVisited();
  res.render("index.ejs", { countries: checkedCountries, total: checkedCountries.length });
});

app.post("/add", async (req, res) => {
  const input = req.body["country"];
  
  //COUPLE OF TRY CATCH BLOCKS TO HANDLE ERROR
  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;
    try {
      await db.query(
        "INSERT INTO visited_countries (country_code) VALUES ($1)",
        [countryCode]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
      const checkedCountries = await checkVisited();
      res.render("index.ejs", {
        countries: checkedCountries,
        total: checkedCountries.length,
        error: "Country has already been added, try again.",
      });
    }
  } catch (err) {
    console.log(err);
    const checkedCountries = await checkVisited();
    res.render("index.ejs", {
      countries: checkedCountries,
      total: checkedCountries.length,
      error: "Country name does not exist, try again.",
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

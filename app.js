const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertTodoDbObjectToResponseObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
  };
};

// ===============================API 1=================================================

app.get("/todos/", async (request, response) => {
  const { status = "", priority = "", search_q = "" } = request.query;
  const query = `select * from todo where status like '%${status}%' and priority like '%${priority}%' and todo like '%${search_q}%';`;
  const dbResponse = await db.all(query);

  response.send(
    dbResponse.map((eachState) =>
      convertTodoDbObjectToResponseObject(eachState)
    )
  );
});
// ===============================API 2=================================================

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const query = `select * from todo where id=${todoId};`;

  let dbResponse = await db.get(query);
  response.send(convertTodoDbObjectToResponseObject(dbResponse));
});
// ===============================API 3=================================================
app.post("/todos/", async (request, response) => {
  const { id, status, priority, todo } = request.body;
  const query = `
  insert into todo values(
${id},
'${todo}',
'${priority}',
'${status}'
  )
  ;`;

  await db.run(query);
  response.send("Todo Successfully Added");
});
// ===============================API 4=================================================
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { status = "", priority = "", todo = "" } = request.body;
  let query = "";
  let column = "";
  if (status != "") {
    query = `
  update
  todo
  set 
  status='${status}' where id=${todoId}
  ;`;
    column = "Status";
  } else if (priority != "") {
    query = `
  update
  todo
  set 
  priority='${priority}' where id=${todoId}
  ;`;
    column = "Priority";
  } else if (todo != "") {
    query = `
  update
  todo
  set 
  todo='${todo}' where id=${todoId}
  ;`;
    column = "Todo";
  }

  await db.run(query);
  response.send(`${column} Updated`);
});

// ===============================API 5=================================================

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const query = `delete from todo where id=${todoId};`;

  let dbResponse = await db.get(query);
  response.send("Todo Deleted");
});

module.exports = app;

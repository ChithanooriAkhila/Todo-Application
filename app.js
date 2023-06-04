const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
var format = require("date-fns/format");
var isValid = require("date-fns/isValid");

const databasePath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3001, () =>
      console.log("Server Running at http://localhost:3001/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const priorityValues = ["HIGH", "LOW", "MEDIUM"];
const statusValues = ["TO DO", "IN PROGRESS", "DONE"];
const categoryValues = ["WORK", "HOME", "LEARNING"];

const convertTodoDbObjectToResponseObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  };
};

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityAndCategoryProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.category !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

function isValidDate(dateObject) {
  return new Date(dateObject).toString() !== "Invalid Date";
}

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status, category } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      if (!statusValues.includes(status)) {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      if (!priorityValues.includes(priority)) {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND priority = '${priority}';`;
      break;
    case hasCategoryAndStatusProperties(request.query):
      if (!statusValues.includes(status)) {
        response.status(400);
        response.send("Invalid Todo Status");
      } else if (!categoryValues.includes(category)) {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND category = '${category}';`;
      break;
    case hasPriorityAndCategoryProperties(request.query):
      if (!priorityValues.includes(priority)) {
        response.status(400);
        response.send("Invalid Todo Priority");
      } else if (!categoryValues.includes(category)) {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND category = '${category}'
        AND priority = '${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      if (!priorityValues.includes(priority)) {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND priority = '${priority}';`;
      break;
    case hasCategoryProperty(request.query):
      if (!categoryValues.includes(category)) {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND category = '${category}';`;
      break;
    case hasStatusProperty(request.query):
      if (!statusValues.includes(status)) {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}';`;
      break;
    default:
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%';`;
  }

  data = await database.all(getTodosQuery);
  response.send(
    data.map((eachState) => convertTodoDbObjectToResponseObject(eachState))
  );
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  let formattedDate;

  try {
    formattedDate = format(new Date(date), "yyyy-MM-dd");
  } catch (e) {
    response.status(400);
    response.send("Invalid Due Date");
  }

  const getTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE
      due_date = '${formattedDate}';`;
  const todos = await database.all(getTodoQuery);
  response.send(
    todos.map((eachState) => convertTodoDbObjectToResponseObject(eachState))
  );
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const getTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE
      id = ${todoId};`;
  const todo = await database.get(getTodoQuery);
  response.send(convertTodoDbObjectToResponseObject(todo));
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;

  let formattedDate;

  try {
    formattedDate = format(new Date(date), "yyyy-MM-dd");
  } catch (e) {
    response.status(400);
    response.send("Invalid Due Date");
  }

  if (!statusValues.includes(status)) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (!priorityValues.includes(priority)) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (!categoryValues.includes(category)) {
    response.status(400);
    response.send("Invalid Todo Category");
  }

  const postTodoQuery = `
    INSERT INTO
      todo (id, todo, priority, status,category,due_date)
    VALUES
      (${id}, '${todo}', '${priority}', '${status}','${category}','${formattedDate}');`;
  await database.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      if (!statusValues.includes(requestBody.status)) {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      if (!priorityValues.includes(requestBody.priority)) {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
    case requestBody.category !== undefined:
      updateColumn = "Category";
      if (!categoryValues.includes(requestBody.category)) {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case requestBody.dueDate !== undefined:
      updateColumn = "Due Date";
      if (!isValidDate(requestBody.dueDate)) {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }
  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`;
  const previousTodo = await database.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,
  } = request.body;

  const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo='${todo}',
      priority='${priority}',
      status='${status}',
      category='${category}',
      due_date='${dueDate}'
    WHERE
      id = ${todoId};`;

  await database.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`;

  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;

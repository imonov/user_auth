import express, { urlencoded } from "express";
import cors from "cors";

import { fileURLToPath } from "node:url";

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { engine } from "express-handlebars";

const app = express();
const PORT = 3000;

app.engine(
    "hbs",
    engine({
        extname: ".hbs",
        defaultLayout: "main",
        layoutsDir: "views/layouts/",
        helpers: {
            range: (from, to) => {
                const arr = [];
                for (let i = from; i <= to; i++) arr.push(i);
                return arr;
            },
            isActive: (current, page) => current === page,
            prevPage: (page) => page - 1,
            nextPage: (page) => page + 1,
        },
    }),
);
app.set("view engine", "hbs");
app.set("views", "./views");

app.use(express.static("public"));

app.use(express.json());
app.use(cors());

app.use(urlencoded({ extended: true }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, "data", "users.json");

function getNextId(arr) {
    return arr.length === 0 ? 1 : arr.at(-1).id + 1;
}

function writeData(data) {
    writeFileSync(filePath, JSON.stringify(data, null, 2));
}
function readData() {
    try {
        return JSON.parse(readFileSync(filePath, "utf-8"));
    } catch {
        return [];
    }
}

// routes

app.get("/", (req, res) => {
    const data = readData();

    const { limit = 10, page = 1 } = req.query;
    const currentPage = Number(page);
    const totalCount = data.length;
    const totalPages = Math.ceil(data.length / Number(limit));

    res.render("home", {
        totalCount,
        totalPages,
        currentPage, // page o'rniga currentPage
        limit: Number(limit),
        hasPrev: currentPage > 1, // qo'shildi
        hasNext: currentPage < totalPages, // qo'shildi
        data: data.slice(
            (currentPage - 1) * Number(limit),
            currentPage * Number(limit),
        ),
    });
});

app.get("/users", (req, res) => {
    const data = readData();

    if (data.length === 0) {
        res.status(200).json({ message: "empty" });
        return;
    }

    res.status(200).send({ users: data });
});
app.post("/users", (req, res) => {
    const { name, phone, username, password, user_image } = req.body;

    const data = readData();

    const userPhone = data.find((e) => e.phone == phone);
    if (userPhone) {
        res.status(409).json({ message: "phone number already exists" });
        return;
    }

    const userName = data.find((e) => e.username == username);
    if (userName) {
        res.status(409).json({ message: "username already exists" });
        return;
    }

    const user = {
        id: getNextId(data),
        name: name,
        phone: phone,
        username: username,
        password: password,
        user_image: user_image ?? "",
    };

    data.push(user);
    writeData(data);
    res.status(201).json({ message: "user created" });
});

app.put("/users/:id", (req, res) => {
    const id = Number(req.params.id);
    const { name, phone, username, password, user_image } = req.body;
    const data = readData();

    const userIndex = data.findIndex((e) => e.id === id);

    if (userIndex === -1) {
        res.status(404).json({ message: "user not found" });
        return;
    }

    data[userIndex].name = name ?? data[userIndex].name;
    data[userIndex].phone = phone ?? data[userIndex].phone;
    data[userIndex].username = username ?? data[userIndex].username;
    data[userIndex].password = password ?? data[userIndex].password;
    data[userIndex].user_image = user_image ?? data[userIndex].user_image;

    writeData(data);
    res.status(200).json({ message: "user updated" });
});

app.delete("/users/:id", (req, res) => {
    const id = Number(req.params.id);
    const data = readData();
    const user = data.findIndex((e) => e.id === id);

    if (user === -1) {
        res.status(404).json({ message: "user not found" });
        return;
    }

    data.splice(user, 1);
    writeData(data);
    res.status(200).json({ message: "user deleted" });
});

app.listen(PORT, () => {
    console.log("Server running 3000");
});

import express from "express";
import cors from "cors";

import { fileURLToPath } from "node:url";

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

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
    res.send("Salom..");
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

app.listen(PORT, () => {
    console.log("Server running 3000");
});

import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import bcrypt from "bcrypt";
import { v4 as uuid } from "uuid";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const port = process.env.PORT;

app.get("/", (req, res) => {
	return res.json({
		ok: true,
		massege: "Bem vindo(a) API de recados!"
	});
});

let users = [];
//signup

app.post("/signup", signupMiddlaware, (req, res) => {
	try {
		const user = req.body;
		const saltRounds = 10;

		bcrypt.hash(user.password, saltRounds, function (err, hash) {
			if (hash) {
				users.push({
					id: uuid(),
					name: user.name,
					email: user.email,
					password: hash,
					message: []
				});
			} else {
				return res.status(400).json({
					ok: false,
					massage: "Houve algum erro!",
					data: err
				});
			}
		});
		return res.status(201).json({
			ok: true,
			massage: "Conta Criada com sucesso"
		});
	} catch (err) {
		return res.status(500).json({
			ok: false,
			data: err
		});
	}
});

app.get("/signup", (req, res) => {
	try {
		res.status(200).json(users);
	} catch (err) {
		return res.status(500).json({
			ok: false,
			data: err
		});
	}
});

function signupMiddlaware(req, res, next) {
	const someEmail = users.some((emailSome) => {
		return emailSome.email === req.body.email;
	});

	if (someEmail) return res.status(422).json({ ok: false, massage: "Email já existe tente outro!" });
	if (!req.body.name) return res.status(422).json({ ok: false, massage: "O nome e obrigatório!" });
	if (!req.body.email) return res.status(422).json({ ok: false, massage: "Email e obrigatório!" });
	if (!req.body.password) return res.status(422).json({ ok: false, massage: "A senha e obrigatório!" });

	next();
}

// login

app.post("/login", async (req, res) => {
	try {
		const { email, password } = req.body;

		if (!email || !password) return res.status(422).json({ ok: false, massage: "Email e senha são obrigatórios" });

		const user = await users.find((u) => u.email === email);
		if (!user) return res.status(402).json({ ok: false, massage: "Usuário ou senha invalida!" });

		const chekPassword = await bcrypt.compare(password, user.password);
		if (!chekPassword) return res.status(422).json({ ok: false, massage: "Usuário ou senha invalida!" });

		return res.status(200).json({ ok: true, massage: "Usuário logado!" });
	} catch (err) {
		return res.status(500).json({
			ok: false,
			data: err
		});
	}
});

function createValidate(req, res, next) {
	if(!req.params.id) return res.status(422).json({ok: false, message: "O id e obrigatório passar por parametro!"})
	if (!req.body.title) return res.status(422).json({ ok: false, message: "O titulo e obrigatório!" });
	if (!req.body.description) return res.status(422).json({ ok: false, message: "A descrição e obrigatória!" });

	next();
}

//Crud Recados

app.post("/message/create/:id", createValidate, async (req, res) => {
	try {
		const id = req.params.id;
		const message = req.body;

		const validateId = users.findIndex((u) => u.id === id);

		const newMessage = {
			id: uuid(),
			title: message.title,
			description: message.description
		};

		await users[validateId].message.push(newMessage);
		return res.status(201).json({
			ok: true,
			massage: "Recado Criado com sucesso!",
			data: newMessage
		});
	} catch (err) {
		return res.status(500).json({
			ok: false,
			data: err
		});
	}
});

//Reade - Ler recados

app.get("/message/reade", (req, res) => {
	try {
		res.status(200).json(users);
	} catch (err) {
		return res.status(500).json({
			ok: false,
			data: err
		});
	}
});

app.get("/message/readID/:id/:idUser", async (req, res) => {
	try {
		const id = req.params.id;
		const idUser = req.params.idUser;

		const validateIdUser = await users.find((u) => u.id === idUser);
		if (!validateIdUser) return res.status(404).json({ ok: false, message: "Usuário não encontrado!" });

		const messages = await validateIdUser.message.find((m) => m.id === id);
		if (!messages) return res.status(404).json({ ok: false, message: "Recado não encontrado!" });

		res.status(200).json({ ok: true, data: messages });
	} catch (err) {
		return res.status(500).json({
			ok: false,
			data: err
		});
	}
});

//Update - Atualizar recados

app.put("/message/update/:id/:idUser", async (req, res) => {
	try {
		const message = req.body;
		const id = req.params.id;
		const idUser = req.params.idUser;

		const validateIdUser = users.findIndex((u) => u.id === idUser);
		if (validateIdUser === -1) return res.status(404).json({ ok: false, message: "Usuário não encrontrado!" });

		const indexMessage = await users[validateIdUser].message.findIndex((m) => m.id === id);
		if (indexMessage === -1) return res.status(404).json({ ok: false, message: "Recado não encontrado!" });

		users[validateIdUser].message[indexMessage] = {
			id: id,
			title: message.title,
			description: message.description
		};
		res.status(200).json({ ok: true, message: "Recado alterdo com sucesso!" });
	} catch (err) {
		return res.status(500).json({
			ok: false,
			data: err
		});
	}
});

//Delete - deletar um recado
app.delete("/message/delete/:id/:idUser", async (req, res) => {
	try {
		const id = req.params.id;
		const idUser = req.params.idUser;

		const validateIdUser = users.findIndex((u) => u.id === idUser);
		if (validateIdUser === -1) return res.status(404).json({ ok: false, message: "Usuário não encrontrado!" });

		const indexMessage = await users[validateIdUser].message.findIndex((m) => m.id === id);
		if (indexMessage === -1) return res.status(404).json({ ok: false, message: "Recado não encontrado!" });

		await users[validateIdUser].message.splice(indexMessage, 1);
		res.status(200).json({ ok: true, message: "Recado deletado com sucesso!" });
	} catch (err) {
		return res.status(500).json({
			ok: false,
			data: err
		});
	}
});
app.listen(port, () => {
	console.log(`Servidor está rodando na porta ${port}`);
});

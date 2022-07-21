const mysql = require('mysql2/promise');

const createConnection = async () => {
	return await mysql.createConnection({
		host: '149.56.185.85',
		user: 'instancia',
		password: 'KoQa5urICO',
		database: 'meuhfc'
	});
}

const lerPergunta = async (pergunta) => {
	const connection = await createConnection();
	const [rows] = await connection.execute('SELECT resposta FROM imagenet_perguntas WHERE pergunta = ?', [pergunta]);
	connection.end();
	if (rows.length > 0) return rows[0].resposta;
	return false;
}

const getUser = async (user) => {
	const connection = await createConnection();
	const [rows] = await connection.execute('SELECT user FROM imagenet_user WHERE user = ?', [user]);
	connection.end();
	if (rows.length > 0) return rows[0].user;
	return false;
}

const setUser = async (user) => {
	const connection = await createConnection();
	const [rows] = await connection.execute('INSERT INTO imagenet_user SET user = ?, porta = 4141', [user]);
	connection.end();
	if (rows.length > 0) return rows[0].user;
	return false;
}

module.exports = {
	createConnection,
	lerPergunta,
	setUser,
	getUser
}

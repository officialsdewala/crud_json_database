const jwt = require('jsonwebtoken');

const secret = process.env.SECRET;
const user = "pankaj";
const password = "123";

module.exports = function (req, res, next) {
    const username = req.body.username;
    const userpassword = req.body.password;
    let token;

    if (!username || !password) {
        return res.json({ error: "Please give valid username and password." })
    }

    if(!(username == user && password == userpassword)){
        return res.json({ error: "Invalid user id or password." });
    }

    try {
        token = jwt.sign({ data: { username: username, password: password } }, secret, { algorithm: 'HS256',expiresIn: '6000000' },);
    } catch (err) {
        console.log(err);
        return res.json({ error: "Something went wrong" })
    }
    
    res.json({token:`Bearer ${token}`});
}
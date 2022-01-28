const express = require('express')
const router = express.Router();

router.get('/api',async (req, res, next) => {
    try{
        res.json({
            status:200,
            message: "APi not build atm"
        })
    }catch(e){
        console.log(e)
        res.sendStatus(500)
    }
});

module.exports = router;
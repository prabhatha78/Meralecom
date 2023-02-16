const fs = require('fs')


module.exports = {
    deleteFile: (imgPath) => {
        fs.unlink(imgPath,(error)=>{
            if(error){
                console.log('Error detected');
                console.log(error.message)
            } else {
                console.log('File deleted.....')
            }
        })
    }
}
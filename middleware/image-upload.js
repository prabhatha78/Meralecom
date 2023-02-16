const multer = require('multer')


const categoryStorage = multer.diskStorage({
    // Destination to store image     
    destination: (req, file, cb) => {
        cb(null, './public/images/category-images')
    },

    filename: (req, file, cb) => {
        cb(null, Date.now() + '--' + file.originalname)
    }
});

const uploadCategory = multer({ storage: categoryStorage }).fields([{ name: 'image', maxCount: 1 }])

const ingredientStorage = multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,'./public/images/ingredient-images')
    },

    filename: (req, file, cb)=>{
        cb(null, Date.now() + '--' + file.originalname)
    }
});

const uploadIngredient = multer({storage:ingredientStorage}).fields([{name: 'image',maxCount:1}])

const productStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/images/product-images')
    },

    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix + '-' + ".png")
    }
});

const uploadProduct = multer({ storage: productStorage }).fields([{ name: 'image1', maxCount: 1 }, { name: 'image2', maxCount: 1 }, { name: 'image3', maxCount: 1 }])



module.exports = { uploadCategory , uploadProduct, uploadIngredient}
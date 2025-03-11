import multer from 'multer';

const multerStorage = multer.memoryStorage();
const upload = multer({ storage: multerStorage });

const optionalUpload = (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            return res.status(400).json({ message: 'Error processing file upload' });
        }
        next();
    });
};

export default optionalUpload;

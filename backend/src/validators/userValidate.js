import yup from 'yup'

export const userSchema = yup.object({
    username: yup.
        string()
        .trim()
        .min(3, 'username must be atleast of 3 characters')
        .required(),
    email: yup
        .string()
        .trim()
        .lowercase()
        .email("Invalid email")
        .required(),
    password: yup
        .string()
        .min(8, "Password must be at least 8 characters")
        .required()

})

export const validateUser = (schema) => async (req, res, next) => {
    try {
        await schema.validate(req.body, {
            abortEarly: false
        });
        next()
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.errors
        })
    }
}
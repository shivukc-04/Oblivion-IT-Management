import User from '../models/user.js'

export async function getAllUsers(_, res){
    try {
            const users = await User.find()
            return res.status(200).send(users)
        } catch (error) {
            console.error(error)
            return res.status(404).json({"message": "Unable to fetch users"})
        }
}
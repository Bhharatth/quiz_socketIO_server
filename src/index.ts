import { IoManager } from "./managers/IoManager";
import { UserManager } from "./managers/Usermanager";


const io = IoManager.getIo();

io.listen(3000);
console.log("Server is listening on port 3000");
const userManager = new UserManager();

io.on("connection", (socket)=> {
    userManager.adduser(socket);
})
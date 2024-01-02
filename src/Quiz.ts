import { IoManager } from "./managers/IoManager";

export type AllowedSubmissions = 0 | 1|2|3
const ProblemTime = 20;

interface User {
    name: string,
    id: string,
    points: number
};

interface Submission {
    problemId: string,
    userId: string,
    isCorrect: boolean,
    optionSelected: AllowedSubmissions
};

interface Problem{
    id: string,
    title: string,
    description: string,
    image?: string,
    startTime: number,
    answer: AllowedSubmissions,
    options: {
        id: string,
        title: string
    }[],
    submissions: Submission[]
};

export class Quiz{
    public roomId: string;
    private hasStarted: boolean;
    private problems: Problem[];
    private activeProblem: number;
    private users : User[];
    private currentState: "leaderBoard"| "question"| "not_started"| "ended"| "active";

    constructor(roomId: string){
        this.roomId = roomId;
        this.hasStarted = false;
        this.problems = [];
        this.activeProblem = 0;
        this.users = [];
        this.currentState = "not_started";
        console.log('Room created');
        setInterval(()=> {
            this.debug()
        },1000)
    }

    debug(){
        console.log("----debug---")
        console.log(this.roomId)
        console.log(JSON.stringify(this.problems))
        console.log(this.users)
        console.log(this.currentState)
        console.log(this.activeProblem);
    }
    addProblem(problem: Problem){
        this.problems.push(problem);
        console.log(this.problems)
    };

    start(){
        this.hasStarted = true;
        this.setActiveProblem(this.problems[0])
    }
    setActiveProblem(problem: Problem){
        this.currentState = "question";
        problem.startTime=  new Date().getTime();
        problem.submissions = [];
        IoManager.getIo().to(this.roomId).emit("problem", {
            problem
        });

        setTimeout(() => {
            this.sendLeaderBoard();
            
        }, ProblemTime * 1000);
    }
    sendLeaderBoard(){
        console.log('send leader board');
        this.currentState = "leaderBoard";
        const leaderBoard = this.getLeaderBoard();
        IoManager.getIo().to(this.roomId).emit("leaderboard", {
            leaderBoard
        })
    }
    next(){
        this.activeProblem++;
        const problem = this.problems[this.activeProblem];
        if(problem){
            this.setActiveProblem(problem);
        }else{
            this.activeProblem--;
        }
    }
    getRandomStringLength(length: number){
        var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()';
        var charLength = chars.length;
        var result = '';
        for ( var i = 0; i < length; i++ ) {
           result += chars.charAt(Math.floor(Math.random() * charLength));
        }
        return result;
    }

    addUser(name: string){
      const  id= this.getRandomStringLength(7);
      this.users.push({
        id,
        name,
        points: 0
      });
      return id;
    }

    submit(userId: string, roomId: string, problemId: string, submissions:AllowedSubmissions){
        console.log("userId");
        console.log(userId);
        const problem = this.problems.find(x=> x.id === problemId);
        const user = this.users.find(x=> x.id === userId);

        if(!problem || !user){
            return;
        };
        const existingSubmission = problem.submissions.find(x=> x.userId === userId);
        if(existingSubmission){
            return;
        };
        problem.submissions.push({
            problemId,
            userId,
            isCorrect : problem.answer === submissions,
            optionSelected: submissions
        });
       user.points += (1000 - (500 * (new Date().getTime() - problem.startTime) / (ProblemTime * 1000)));
    };
    getLeaderBoard(){
        return this.users.sort((a, b)=> a.points < b.points ? 1 : -1).slice(0,20);
    }

    getCurrentState(){
        if(this.currentState === "not_started"){
            return{
                type: "not_started"
            }
        }
        if(this.currentState === "ended"){
            return {
                type: "ended",
                leaderboard: this.getLeaderBoard()
            }
        }
        if(this.currentState === "leaderBoard"){
            return {
                type: "leader_board",
                leaderboard: this.getLeaderBoard()
            }
        }
        if(this.currentState === "question"){
            const problem = this.problems[this.activeProblem];
            return{
                type: "question",
                problem
            }
        }
    }
}
const express = require('express');
const { createQuiz, updateQuiz, getallQuizzes, getQuizById, deleteQuizById, updatyeAttemptsById, updateOptionCount, answerCount, incrementLinkOpenCount } = require('../Controllers/quizController')

const quizRouter = express.Router();

quizRouter.post('/create', createQuiz);
quizRouter.post('/increment-attempts/:quizId', updatyeAttemptsById);
quizRouter.post('/:quizId/question/:questionIndex/option/:optionIndex', updateOptionCount);
quizRouter.post('/answer/:quizId/:questionIndex/:optionIndex', answerCount);
quizRouter.post('/:quizName/open', incrementLinkOpenCount)
quizRouter.put('/update/:quizId', updateQuiz);
quizRouter.get('/all', getallQuizzes);
quizRouter.get('/details/:quizId', getQuizById);
quizRouter.delete('/delete/:quizId', deleteQuizById)


module.exports = quizRouter;
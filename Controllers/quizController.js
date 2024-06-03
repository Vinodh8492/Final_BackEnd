const express = require('express');
const Quiz = require('../Model/Quiz')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const createQuiz = async (req, res, next) => {
    try {

        const { quizName, quizType, questions, timer } = req.body;
        const creatorEmail = req.body.creatorEmail;

        if (!quizName || !quizType || !questions || questions.length === 0 || timer === undefined) {
            return res.json({
                message: "Quiz name, quiz type, and questions are required."
            });
        }

        if (questions.length > 5) {
            return res.json({
                message: "Maximum 5 questions allowed per quiz."
            });
        }

        if (!['Q&A', 'Poll'].includes(quizType)) {
            return res.json({
                message: "Invalid quiz type. Allowed values are 'Q&A' or 'Poll'."
            });
        }

        if (![null, 0, 5, 10].includes(timer)) {
            return res.json({
                message: "Invalid timer value. Allowed values are null, 5, or 10."
            });
        }

        for (let question of questions) {
            if (!question.options || question.options.length < 2 || question.options.length > 4) {
                return res.json({ message: "Each question must have at least 2 options and at most 4 options." });
            }

            question.options = question.options.map(option => ({
                ...option,
                optionType: option.optionType || 'default' // Add a default optionType if it's missing
            }));
        }

        const existingQuiz = await Quiz.findOne({ quizName });

        if (existingQuiz) {
            return res.json({
                message: "Quiz with the same name already exists."
            });
        }

        const quiz = new Quiz({
            quizName,
            quizType,
            questions,
            timer,
            creatorEmail,
        });

        await quiz.save();
        res.status(201).json({
            message: "Quiz created successfully",
            quiz
        });

    } catch (error) {

    }
};


const incrementLinkOpenCount = async (req, res) => {
    try {
        const { quizName } = req.params;
        const quiz = await Quiz.findOneAndUpdate({ _id: quizName }, { $inc: { linkOpenCount: 1 } }, { new: true });
        if (!quiz) {
            return res.status(404).json({ error: 'Quiz not found' });
        }
        return res.status(200).json({ message: 'Link open count incremented successfully', linkOpenCount: quiz.linkOpenCount });
    } catch (error) {
        console.error('Error incrementing link open count:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const updateQuiz = async (req, res) => {
    try {
        const quizId = req.params.quizId;

        if (!quizId) {
            return res.json({
                message: "Invalid credentials"
            });
        }

        const existingQuiz = await Quiz.findById(quizId);
        if (!existingQuiz) {
            return res.json({
                message: "Quiz not found"
            });
        }

        const updatedData = req.body;
        

        existingQuiz.questions = updatedData.questions.map((updatedQuestion, index) => {
            const existingQuestion = existingQuiz.questions[index] || {};
            return {
                ...existingQuestion,
                question: updatedQuestion.question || existingQuestion.question,
                options: updatedQuestion.options || existingQuestion.options
            };
        });

        existingQuiz.quizType = updatedData.quizType || existingQuiz.quizType;

        if (existingQuiz.quizType === 'Q&A') {
            existingQuiz.questions.forEach((question, index) => {
                if (updatedData.questions[index] && updatedData.questions[index].correctOption !== undefined) {
                    question.correctOption = updatedData.questions[index].correctOption;
                }

                
            });
        }
        

        const updatedTimer = updatedData.timer;
        if (updatedTimer === 0 || updatedTimer === 5 || updatedTimer === 10) {
            existingQuiz.timer = updatedTimer;
        } else {
            return res.json({
                message: "Invalid timer value. Timer value must be 0, 5, or 10."
            });
        }

        for (let question of existingQuiz.questions) {
            if (question.options.length < 2 || question.options.length > 4) {
                return res.json({
                    message: "Each question must have at least 2 options and at most 4 options."
                });
            }

            
        }

        await existingQuiz.save();

        res.json({
            message: "Quiz updated successfully",
            updatedQuiz: existingQuiz
        });

    } catch (error) {
        res.json(error);
    }
}

const getQuizById = async (req, res) => {
    try {
        const quizId = req.params.quizId;

        if (!quizId) {
            return res.json({ message: "Bad Request" })
        }

        const quizDetails = await Quiz.findById(quizId, { questions: 1, option1: 1, option2: 1, option3: 1, option4: 1, quizType: 1, timer: 1, correctAnswerIndices: 1 });
        res.json({ data: quizDetails })
    } catch (error) {

    }
}


const updateOptionCount = async (req, res) => {
    try {
        const { quizId, questionIndex, optionIndex } = req.params;
        const userId = req.body.userId;

        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.send('Quiz not found');
        }

        await quiz.incrementOptionCount(questionIndex, optionIndex, userId);
        res.status(200).send('Option count incremented successfully');
    } catch (error) {
        res.status(500).send(error.message);
    }
};


const answerCount = async (req, res) => {
    try {
        const { quizId, questionIndex, optionIndex } = req.params;
        const userId = req.body.userId;

        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.send('Quiz not found');
        }

        await quiz.incrementOptionCount(questionIndex, optionIndex, userId);
        res.status(200).send('Answer recorded successfully');
    } catch (error) {
        res.status(500).send(error.message);
    }
}


const updatyeAttemptsById = async (req, res) => {
    const { quizId } = req.params;

    try {
        const quiz = await Quiz.findById(quizId);

        if (!quiz) {
            return res.json({ message: 'Quiz not found' });
        }

        quiz.quizAttempts += 1;
        await quiz.save();

        return res.json({ message: 'Quiz attempts incremented successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

const deleteQuizById = async (req, res, next) => {
    try {
        const quizId = req.params.quizId;
        if (!quizId) {
            return res.json({ message: "Bad Request" });
        }

        const result = await Quiz.deleteOne({ _id: quizId });

        if (result.deletedCount === 0) {
            return res.json({ message: "Quiz not found" });
        }
        return res.json({ message: "Quiz deleted successfully" });
    } catch (error) {

    }
}

const getallQuizzes = async (req, res) => {
    try {
        const Category = req.query.Category;

        let filter = {};
        if (Category) {
            const regex = new RegExp(Category, "i");
            filter = { Category: regex };
        }

        const quizList = await Quiz.find(filter);

        res.json({ data: quizList });

    } catch (error) {
        res.json(error)
    }
}


module.exports = { createQuiz, updateQuiz, getallQuizzes, getQuizById, deleteQuizById, updatyeAttemptsById, updateOptionCount, answerCount, incrementLinkOpenCount }
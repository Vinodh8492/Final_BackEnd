const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
    entity1: {
        type: String,
        required: true
    },
    entity2: {
        type: String
    },
    optionCountEntity1: {
        type: Number,
        default: 0
    },
    optionCountEntity2: {
        type: Number,
        default: 0
    },
    
});

const questionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true
    },
    options: {
        type: [optionSchema],
        validate: {
            validator: function (array) {
                return array.length >= 2 && array.length <= 4;
            },
            message: 'A question must have 2 to 4 options.'
        },
        required: true
    },
    correctOption: {
        type: Number,
        validate: {
            validator: function (value) {
                return Number.isInteger(value) && value >= 0 && value < this.options.length;
            },
            message: 'Correct option must be a non-negative integer within the range of options.'
        }
    },
    userAnswers: [{ type: Number, default: -1 }]


});

const quizSchema = new mongoose.Schema({

    quizName: {
        type: String,
        required: true
    },
    quizAttempts: {
        type: Number,
        default: 0
    },
    quizType: {
        type: String,
        enum: ['Q&A', 'Poll'],
        required: true
    },
    timer: {
        type: Number,
        enum: [0, 5, 10],
        default: null,
        required: true
    }
    ,
    questions: {
        type: [questionSchema],
        required: true,
        validate: {
            validator: function (array) {
                return array.length >= 1 && array.length <= 5;
            },
            message: 'A quiz must have 1 to 5 questions.'
        }
    },
    creatorEmail: { type: String, required: true },
    linkOpenCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: {
        createdAt: "createdAt",
        updatedAt: "updatedAt"
    }
});

quizSchema.pre('validate', function (next) {
    if (this.questions && this.questions.length > 0) {
        const optionTypes = this.questions.map(question => {
            if (question.options.every(option => option.entity1 && option.entity2)) return 'textAndImageUrl';
            if (question.options.every(option => option.entity1)) return 'text';
            if (question.options.every(option => option.entity2)) return 'imageUrl';
            return null;
        });

        if (optionTypes.every(type => type === optionTypes[0])) {
            next();
        } else {
            next(new Error('All questions in a quiz must have options of the same type: either text, image URL, or both text and image URL.'));
        }
    } else {
        next();
    }
});


quizSchema.methods.incrementOptionCount = async function (questionIndex, optionIndex) {
    const question = this.questions[questionIndex];
    if (!question) throw new Error('Question not found');

    const option = question.options[optionIndex];
    if (!option) throw new Error('Option not found');

    if (option.entity1 && option.entity2) {
        option.optionCountEntity1 += 1;
        option.optionCountEntity2 += 1;
    } else if (option.entity1) {
        option.optionCountEntity1 += 1;
    } else if (option.entity2) {
        option.optionCountEntity2 += 1;
    }

    question.userAnswers.push(optionIndex);

    await this.save();
};

module.exports = mongoose.model('Quiz', quizSchema);


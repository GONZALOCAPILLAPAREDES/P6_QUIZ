const Sequelize = require("sequelize");
const {models} = require("../models");





// Autoload the quiz with id equals to :quizId
exports.load = (req, res, next, quizId) => {

    models.quiz.findById(quizId)
    .then(quiz => {
        if (quiz) {
            req.quiz = quiz;
            next();
        } else {
            throw new Error('There is no quiz with id=' + quizId);
        }
    })
    .catch(error => next(error));
};


// GET /quizzes
exports.index = (req, res, next) => {

    models.quiz.findAll()
    .then(quizzes => {
        res.render('quizzes/index.ejs', {quizzes});
    })
    .catch(error => next(error));
};


// GET /quizzes/:quizId
exports.show = (req, res, next) => {

    const {quiz} = req;

    res.render('quizzes/show', {quiz});
};


// GET /quizzes/new
exports.new = (req, res, next) => {

    const quiz = {
        question: "", 
        answer: ""
    };

    res.render('quizzes/new', {quiz});
};

// POST /quizzes/create
exports.create = (req, res, next) => {

    const {question, answer} = req.body;

    const quiz = models.quiz.build({
        question,
        answer
    });

    // Saves only the fields question and answer into the DDBB
    quiz.save({fields: ["question", "answer"]})
    .then(quiz => {
        req.flash('success', 'Quiz created successfully.');
        res.redirect('/quizzes/' + quiz.id);
    })
    .catch(Sequelize.ValidationError, error => {
        req.flash('error', 'There are errors in the form:');
        error.errors.forEach(({message}) => req.flash('error', message));
        res.render('quizzes/new', {quiz});
    })
    .catch(error => {
        req.flash('error', 'Error creating a new Quiz: ' + error.message);
        next(error);
    });
};


// GET /quizzes/:quizId/edit
exports.edit = (req, res, next) => {

    const {quiz} = req;

    res.render('quizzes/edit', {quiz});
};


// PUT /quizzes/:quizId
exports.update = (req, res, next) => {

    const {quiz, body} = req;

    quiz.question = body.question;
    quiz.answer = body.answer;

    quiz.save({fields: ["question", "answer"]})
    .then(quiz => {
        req.flash('success', 'Quiz edited successfully.');
        res.redirect('/quizzes/' + quiz.id);
    })
    .catch(Sequelize.ValidationError, error => {
        req.flash('error', 'There are errors in the form:');
        error.errors.forEach(({message}) => req.flash('error', message));
        res.render('quizzes/edit', {quiz});
    })
    .catch(error => {
        req.flash('error', 'Error editing the Quiz: ' + error.message);
        next(error);
    });
};


// DELETE /quizzes/:quizId
exports.destroy = (req, res, next) => {

    req.quiz.destroy()
    .then(() => {
        req.flash('success', 'Quiz deleted successfully.');
        res.redirect('/quizzes');
    })
    .catch(error => {
        req.flash('error', 'Error deleting the Quiz: ' + error.message);
        next(error);
    });
};


// GET /quizzes/:quizId/play
exports.play = (req, res, next) => {

    const {quiz, query} = req;

    const answer = query.answer || '';

    res.render('quizzes/play', {
        quiz,
        answer
    });
};

//GET /quizzes/randomplay
exports.randomplay = (req,res,next) => {


    if(req.session.randomPlay){
        quizRender(req,res,next);
    }else {
        req.session.randomPlay= [];
        req.session.score= 0;
        let i=0;
        models.quiz.findAll({raw: true})
            .each(quiz => {

                    req.session.randomPlay[i] = quiz.id;
                    i++;

            })
            .then(() =>{
                quizRender(req,res,next);
            });
    }
};
// Metodo axuliar para renderizar
 quizRender= (req,res,next) =>{
     req.session.num  =Math.floor(Math.random()*req.session.randomPlay.length)
     let random_id = req.session.randomPlay[ req.session.num ];

     const query=req;
     const score=req.session.score;
     const answer = query.answer ||'';
     models.quiz.findById(random_id)
         .then(quiz =>{
             if(quiz){
                 res.render('quizzes/randomplay',{
                     quiz,
                     answer,
                     score
                 });
             }else{
                 res.render('quizzes/randomnomore',{score:0});
             }
         })

 }

//GET /quizzes/randomcheck
exports.randomcheck=(req,res,next)=>{

    const {quiz,query}=req;

    const answer= query.answer ||"";
    const result =answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim();

     if(result) {
         req.session.randomPlay.splice(req.session.num,1);
         req.session.score++;

     }
     const score = req.session.score;

     if(req.session.randomPlay.length === 0){
         req.session.score=0;
         req.session.randomPlay=[];
         res.render('quizzes/randomnomore',{
             score
         });
     }else{
         res.render('quizzes/randomresult',{
             quiz,
             result,
             answer,
             score
         });
     }


};


// GET /quizzes/:quizId/check
exports.check = (req, res, next) => {

    const {quiz, query} = req;

    const answer = query.answer || "";
    const result = answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim();

    res.render('quizzes/result', {
        quiz,
        result,
        answer
    });

};

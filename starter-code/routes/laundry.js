// routes/laundry.js
const express = require('express');

const User = require('../models/user');
const LaundryPickup = require('../models/laundry-pickup');

const router = express.Router();

//middleware
router.use((req, res, next) => {
  if (req.session.currentUser) {
    next();
    return;
  }

  res.redirect('/login');
});


router.get('/dashboard', (req, res, next) => {
  let query;

  if (req.session.currentUser.isLaunderer) {
    query = { launderer: req.session.currentUser._id };
  } else {
    query = { user: req.session.currentUser._id };
  }

  LaundryPickup
    .find(query)
    .populate('user', 'name')
    .populate('launderer', 'name')
    .sort('pickupDate')
    .exec((err, pickupDocs) => {
      if (err) {
        next(err);
        return;
      }

      res.render('laundry/dashboard', {
        pickups: pickupDocs,
        user: req.session.currentUser.name,
        actualDate: new Date()
      });
    });
});

router.post('/launderers', (req, res, next) => {
  const userId = req.session.currentUser._id;
  const laundererInfo = {
    fee: req.body.fee,
    isLaunderer: true
  };

  User.findByIdAndUpdate(userId, laundererInfo, { new: true }, (err, theUser) => {
    if (err) {
      next(err);
      return;
    }

    req.session.currentUser = theUser;

    res.redirect('/dashboard');
  });
});

router.post('/launderers/:id/delete',(req, res, next) => {

  const laundererId = req.params.id;
  const userID = req.session.currentUser._id;
  debugger;

  if (req.body.nolaunder === "nolaunder"){
      const myModifiedUser = {
        isLaunderer: false,
        fee: 0
      }
      User.findByIdAndUpdate(laundererId,myModifiedUser,{new: true},(err, theModifiedUser) => {
        if (err){
          return next(err);
        }
        debugger;
        console.log(theModifiedUser)
        req.session.currentUser = theModifiedUser;
        res.redirect('/dashboard');
      })
  }   else res.redirect('/launderers');

})


router.get('/launderers', (req, res, next) => {
  User.find({ isLaunderer: true }, (err, launderersList) => {
    if (err) {
      next(err);
      return;
    }

    res.render('laundry/launderers', {
      launderers: launderersList
    });
  });
});


router.get('/launderers/:id', (req, res, next) => {
  const laundererId = req.params.id;

  User.findById(laundererId, (err, theUser) => {
    if (err) {
      next(err);
      return;
    }

    res.render('laundry/launderer-profile', {
      theLaunderer: theUser
    });
  });
});

router.post('/laundry-pickups/delete',(req, res, next) => {

  let pickupToDelete = req.body.button;

  LaundryPickup.findByIdAndRemove(pickupToDelete,(err, theLaundryPickupRemoved) => {
    if (err) return next(err);
    console.log("Elemento eliminado", theLaundryPickupRemoved);
    res.redirect('/dashboard');
  })

})

router.post('/laundry-pickups', (req, res, next) => {
  const pickupInfo = {
    pickupDate: req.body.pickupDate,
    launderer: req.body.laundererId,
    user: req.session.currentUser._id
  };

  const thePickup = new LaundryPickup(pickupInfo);

  thePickup.save((err) => {
    if (err) {
      next(err);
      return;
    }

    res.redirect('/dashboard');
  });
});

module.exports = router;

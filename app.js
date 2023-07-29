// Using Express
const express = require('express');
const app = express();
const cloudinary = require('cloudinary').v2;

// To remove cors error 
const cors = require('cors');

// npm Packages 
const cron = require('node-cron');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');

// DataBase
require('./connection');
cloudinary.config({
    cloud_name: process.env.CLOUDNAME,
    api_key: process.env.APIKEY,
    api_secret: process.env.APISECRET
});
// Dotenv
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

// const client = require('twilio')(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN)
//Port
const port = process.env.PORT || 5000;
//SERVICE ID TWILIO
// const SERVICE_ID = process.env.SERVICE_ID;
app.use(express.json());
app.use(express.urlencoded({ extended: false }))
app.use(cors());
app.use(cookieParser());

app.get('/', (req, res) => {
    res.send('Backend for Skitii running...');
})

//Middleware 
const Authentication = require('./Middleware/Authentication');
//Models
const Users = require('./Models/user');
const Schedule = require('./Models/Schedule');
const Splash = require('./Models/splash');
const Points = require('./Models/PointsHistory');
const GameSlot = require('./Models/GameSlot');
const GameQuestion = require('./Models/GameQuestion');
const Splashanswer = require('./Models/Splashanswer');
const Audio = require('./Models/Audio');
const AudioMood = require('./Models/AudioMood');
const Payments = require('./Models/Payments');
const Group = require('./Models/Group');
const AudioSleep = require('./Models/AudioSleep');
const Friends = require('./Models/Friends');

const { default: mongoose, now } = require('mongoose');

/**************************************API's************************************** */

//Register
app.post('/api/register', async (req, res, next) => {
    try {
        const { Name, day, month, year, Gender, Phone, Parentphone, Password, Institute, City, State, Language, referralcode } = req.body;
        if (!Name || !day || !month || !year || !Gender || !Phone || !Password || !Institute || !City || !State || !Language) {
            return res.status(401).send('Data Missing');
        }
        const check = await Users.findOne({ Phone: Phone })
        if (check) {
            return res.status(409).send('User Already Exists');
        }
        const user = await new Users({
            Name: Name,
            Birthday: {
                day: day,
                month: month,
                year: year
            },
            Gender: Gender,
            Phone: Phone,
            Institute: Institute,
            City: City,
            State: State,
            Language: Language,
            Coins: 100,
        })
        if (Parentphone) {
            await user.set('Parentphone', Parentphone);
        }

        bcryptjs.hash(Password, 10, async (err, hashedpassword) => {
            if (err) {
                return res.send('error in Hashing');
            }
            await user.set('Password', hashedpassword);
            await user.save();


            const thisuser = await Users.findOne({ Phone: Phone });
            const History = await new Points({
                userid: thisuser._id,
                History: [{
                    Date: new Date(),
                    Activity: "Joining bonus",
                    Points: 100,
                }]
            })
            await History.save();


            if (referralcode) {
                const bonususer = await Users.findOne({ referralcode: referralcode })
                if (bonususer) {
                    const a = await Users.findOneAndUpdate({ _id: bonususer._id }, {
                        Coins: bonususer.Coins + 500,
                    }, {
                        returnDocument: 'after'
                    })
                    const b = await Points.findOneAndUpdate({ userid: bonususer._id }, {
                        $push: {
                            History: {
                                Date: new Date(),
                                Activity: "referral",
                                Points: 500,
                                Task: thisuser.Phone
                            }
                        }
                    }, {
                        returnDocument: 'after'
                    })
                    console.log(b);
                }
            }
            res.status(200).send('Succesfully registered.')
        })
    } catch (error) {
        res.status(500).send('Register Server Error!');
    }

})

app.post('/api/registerotp', async (req, res, next) => {
    try {
        const { phone } = req.body;
        if (!phone) {
            return res.status(422).send('Not valid details')
        }
        const userdetails = await Users.findOne({ Phone: phone });
        if (userdetails) {
            console.log('User Not found');
            return res.status(400).send('User already exists');
        }
        res.status(200).send('success');
    } catch (error) {
        return res.status(500).send('Login Server Error!');
    }
})

// app.post('/api/registerverify', async (req, res) => {
//     try {
//         const { otp, phone } = req.body;
//         console.log(req.body);
//         if (!phone || !otp) {
//             return res.status(422).send('Not valid details')
//         }
//         const userdetails = await Users.findOne({ Phone: phone });
//         if (userdetails) {
//             return res.status(409).send('Already exists');
//         }
//         client
//             .verify.v2
//             .services(SERVICE_ID)
//             .verificationChecks
//             .create({
//                 to: `+91${phone}`,
//                 code: otp
//             })
//             .then(data => {
//                 if (data.status === "approved") {
//                     res.status(200).send('verified');
//                 }
//                 else {
//                     console.log('here');
//                     return res.status(400).send("Otp not verified successfully !");
//                 }
//             })

//     } catch (error) {
//         return res.status(500).send('Otp Server Error!');

//     }
// })

// app.post('/api/forgotverify', async (req, res) => {
//     try {
//         const { otp, phone } = req.body;
//         console.log(req.body);
//         if (!phone || !otp) {
//             return res.status(422).send('Not valid details')
//         }
//         const userdetails = await Users.findOne({ Phone: phone });
//         if (!userdetails) {
//             return res.status(404).send('user not exists');
//         }
//         client
//             .verify.v2
//             .services(SERVICE_ID)
//             .verificationChecks
//             .create({
//                 to: `+91${phone}`,
//                 code: otp
//             })
//             .then(data => {
//                 if (data.status === "approved") {
//                     res.status(200).send('verified');
//                 }
//                 else {
//                     console.log('here');
//                     return res.status(400).send("Otp not verified successfully !");
//                 }
//             })

//     } catch (error) {
//         return res.status(500).send('Otp Server Error!');

//     }
// })

app.post('/api/login', async (req, res, next) => {
    try {
        const { phone } = req.body;
        if (!phone) {
            return res.status(422).send('Not valid details')
        }
        const userdetails = await Users.findOne({ Phone: phone });
        if (!userdetails) {
            console.log('User Not found');
            return res.status(404).send('User Not found');
        }
        const JWT_SECRET_KEY = process.env.JWT_SECRET;
        const payload = {
            id: userdetails._id,
            Name: userdetails.Name
        }
        jwt.sign(
            payload,
            JWT_SECRET_KEY,
            (err, token) => {
                if (err) { res.json({ message: err }) }
                else {
                    console.log(token);
                    return res.status(200).json({ userdetails, token })
                }
            }
        )
    } catch (error) {
        return res.status(500).send({ message: 'Login Server Error!', error: error.message });

    }
})

// app.post('/api/verifyOtp', async (req, res) => {
//     try {
//         const { otp, phone } = req.body;
//         const userdetails = await Users.findOne({ Phone: phone });
//         if (!userdetails) {
//             console.log('User Not found');
//             return res.status(404).send('User Not found');
//         }
//         client
//             .verify.v2
//             .services(SERVICE_ID)
//             .verificationChecks
//             .create({
//                 to: `+91${phone}`,
//                 code: otp
//             })
//             .then(data => {
//                 if (data.status === "approved") {
//                     const payload = {
//                         id: userdetails._id,
//                         Name: userdetails.Name
//                     }
//                     const JWT_SECRET_KEY = process.env.JWT_SECRET;
//                     jwt.sign(
//                         payload,
//                         JWT_SECRET_KEY,
//                         (err, token) => {
//                             if (err) { res.json({ message: err }) }
//                             else {
//                                 console.log(token);
//                                 return res.status(200).json({ userdetails, token })
//                             }
//                         }
//                     )
//                 }
//                 else {
//                     console.log('here');
//                     return res.status(400).send("Otp not verified successfully !");
//                 }
//             })
//     } catch (error) {
//         return res.status(500).send('Otp Server Error!');

//     }
// })

app.post('/api/emaillogin', async (req, res, next) => {
    try {
        console.log('hitt');
        const { email, password } = await req.body;
        if (!email || !password) {
            res.status(400).send('cannot be empty')
        }
        const user = await Users.findOne({ Email: email });
        if (!user) {
            res.status(401).send('Invalid user or password');
        } else {
            const validate = await bcryptjs.compare(password, user.Password);
            if (!validate) {
                res.status(401).send('Invalid user or password');
            } else {
                const payload = {
                    id: user._id,
                    username: user.username
                }
                const JWT_SECRET_KEY = process.env.JWT_SECRET
                jwt.sign(
                    payload,
                    JWT_SECRET_KEY,
                    (err, token) => {
                        if (err) { res.json({ message: err.message }) }
                        else {
                            return res.status(200).json({ user, token })
                        }
                    }
                )
            }
        }
    } catch (error) {
        res.status(500).send(error);
    }
})

app.post('/api/updatepassword', async (req, res) => {
    try {
        const { password, phone } = req.body;
        if (!password || !phone) {
            return res.status(401).send('not found')
        }
        const protectedpassword = await bcryptjs.hash(password, 10);
        const updatepassword = await Users.findOneAndUpdate({ Phone: phone }, {
            Password: protectedpassword
        }, { returnDocument: 'after' });
        console.log(updatepassword);
        res.status(200).send('password updated');
    } catch (error) {
        res.status(500).send(error);
    }
})

app.post('/api/createschedule', Authentication, async (req, res) => {
    try {
        const { title, description, priority, date, time } = req.body;
        console.log(title, description, priority, date, time);

        if (!title || !description || !priority || !date || !time) {
            return res.status(400).send("Cannot be empty");
        }

        const user = req.user;
        // console.log(user);
        const Createschedule = await new Schedule({
            user: user._id,
            title: title,
            description: description,
            priority: priority,
            date: date,
            time: time
        })

        const a = await Createschedule.save();
        res.status(200).send("Successfully Created");

    } catch (error) {

        return res.status(500).json({ Createschedule });

    }
})

app.post('/api/editschedule', Authentication, async (req, res) => {
    try {
        const { _id, title, description, priority, date, time } = req.body;
        console.log(_id, title, description, priority, date, time);

        if (!_id || !title || !description || !priority || !date || !time) {
            return res.status(400).send("Cannot be empty");
        }

        const user = req.user;
        // console.log(user);
        const updateschedule = await Schedule.findOneAndUpdate({ _id: _id }, {

            title: title,
            description: description,
            priority: priority,
            date: date,
            time: time

        }, {
            returnDocument: 'after'
        })

        // console.log(updateschedule);
        res.status(200).json({ updateschedule });

    } catch (error) {

        return res.status(500).send('Schedule Server Error!');

    }
})

app.get('/api/showschedule', Authentication, async (req, res) => {
    try {
        const user = req.user;
        const Schedules = await Schedule.find({ user: user._id })
        // console.log(Schedules);
        return res.status(200).json({ Schedules });

    } catch (error) {
        return res.status(500).send('Schedule Server Error!');
    }
})

app.post('/api/editrevision', Authentication, async (req, res) => {
    try {
        const { id, revision } = req.body;
        if (!id || !revision) {
            return res.status(400).send("Cannot be empty");
        }
        const updaterevision = await Schedule.findOneAndUpdate({ _id: id }, {
            revision: revision
        },
            { returnDocument: "after" }
        )
        console.log(updaterevision);
        return res.status(200).send('revision updated');


    } catch (error) {
        return res.status(500).send('revision Server Error!');

    }
})

app.post('/api/editdifficulty', Authentication, async (req, res) => {
    try {
        const { id, difficulty } = req.body;
        if (!id || !difficulty) {
            return res.status(400).send("Cannot be empty");
        }
        const updatedifficulty = await Schedule.findOneAndUpdate({ _id: id }, {
            difficulty: difficulty
        },
            { returnDocument: "after" }
        )
        console.log(updatedifficulty);
        return res.status(200).send('difficulty updated');


    } catch (error) {
        return res.status(500).send('difficulty Server Error!');

    }
})

app.post('/api/editprogress', Authentication, async (req, res) => {
    try {
        const { id, progress } = req.body;
        if (!id || !progress) {
            return res.status(400).send("Cannot be empty");
        }
        console.log(progress);
        const updateprogress = await Schedule.findOneAndUpdate({ _id: id }, {
            progress: progress
        },
            { returnDocument: "after" }
        )
        console.log(updateprogress);
        return res.status(200).send('progress updated');


    } catch (error) {
        return res.status(500).send('progress Server Error!');

    }
})

app.delete('/api/deleteschedule', Authentication, async (req, res) => {
    try {
        const { id } = req.body;

        if (!id) {
            return res.status(400).send("Cannot be empty");
        }
        const deleteSchedules = await Schedule.deleteOne({ _id: id });
        console.log(deleteSchedules.deletedCount);
        if (deleteSchedules.deletedCount == 0) {
            return res.status(200).send('Nothing to delete');

        }
        return res.status(200).send('Schedule deleted');


    } catch (error) {
        return res.status(500).send('delete Server Error!');

    }
})

// app.post('/api/splashh', Authentication, async (req, res) => {
//     try {
//         const { q } = req.body;

//         if (!q) {
//             return res.status(400).send("Cannot be empty");
//         }
//         const spl = await new Splash({
//             Question: q
//         })

//         await spl.save();
//         return res.status(200).send('Splash added');


//     } catch (error) {
//         return res.status(500).send('Splash Server Error!');

//     }
// })

app.get('/api/splashquestion', Authentication, async (req, res) => {

    try {
        const AllSplash = await Splash.find();
        const length = AllSplash.length;
        // alogrithm
        const a = Math.floor((Math.random() * length));
        const singlesplash = AllSplash[a % length];
        return res.status(200).json({ singlesplash })


    } catch (error) {
        return res.status(500).send('Splash Question Server Error!');

    }

})

// app.get('/api/splashoption', Authentication, async(req ,res)=>{

//     try {
//        const {contacts} = req.body;
//        const length = contacts.length;
//        const y = Math.floor((Math.random() * length)); 
//         const options = {
//             option1: contacts[y % length],
//             option2: contacts[y+10 % length],
//             option3: contacts[y+20 % length],
//             option4: contacts[y+30 % length]
//    }
//         return res.status(200).json({options})


//     } catch (error) {
//         return  res.status(500).send('Splash Option Server Error!');

//     }

// })

app.post('/api/splashanswer', Authentication, async (req, res) => {
    try {
        const { id, Choice } = req.body;
        const user = req.user;
        if (!id || !Choice) {
            return res.status().send('Invalid details')
        }
        const Number = await Choice.replace(/[^+\d]+/g, "");
        const isUserExist = await Users.findOne({ Phone: Number });
        if (!isUserExist) {
            return res.status(404).json({ message: ' Invite the Contact Number' })
        }
        const resd = await new Splashanswer({
            selected: isUserExist._id,
            selectedby: user._id,
            time: new Date(),
            Question: id
        })

        await resd.save();
        return res.status(200).send('success');
    } catch (error) {
        console.log('fff');
        res.status(500).send('Splash Answer Server Error!');

    }

})

app.get('/api/userdetails', Authentication, async (req, res) => {
    try {
        const user = req.user;
        return res.status(200).json({ user })
    } catch (error) {
        res.status(500).send('userdetails error')
    }
})

// app.post('/api/updatecoins', Authentication, async (req, res) => {
//     try {
//         const { coins } = req.body;
//         const user = req.user;
//         const updatedcoins = await Users.findOneAndUpdate({ _id: user._id }, {
//             Coins: coins
//         }, { returnDocument: 'after' });
//         return res.status(200).json({ updatedcoins });
//     } catch (error) {
//         res.status(500).send('updatecoins error')

//     }
// })

app.post('/api/ticktokcoins', Authentication, async (req, res) => {
    try {
        const { coins } = req.body;
        const user = req.user;
        const updatedcoins = await Users.findOneAndUpdate({ _id: user._id }, {
            Coins: user.Coins + coins,
            level: user.level + coins,
        }, { returnDocument: 'after' });
        const b = await Points.findOneAndUpdate({ userid: user._id }, {
            $push: {
                History: {
                    Date: new Date(),
                    Activity: 'ticktok',
                    Points: coins,
                    Duration: parseInt(coins / 2)
                }
            }
        })
        return res.status(200).json({ updatedcoins });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('addcoins error')

    }
})

app.post('/api/splashcoins', Authentication, async (req, res) => {
    try {
        const { coins, id } = req.body;
        const user = req.user;
        if (user.Coins < coins) {
            return res.status(401).json({ message: 'Not enough coins' });
        }
        const updatedcoins = await Users.findOneAndUpdate({ _id: user._id }, {
            Coins: user.Coins - coins,
        }, { returnDocument: 'after' });
        const updatesplashview = await Splashanswer.findOneAndUpdate({ _id: id }, {
            showsplash: true
        }, { returnDocument: 'after' });
        console.log(updatesplashview);
        const b = await Points.findOneAndUpdate({ userid: user._id }, {
            $push: {
                History: {
                    Date: new Date(),
                    Activity: 'Splash',
                    Points: coins,
                }
            }
        })
        return res.status(200).json({ updatedcoins });
    } catch (error) {

        res.status(500).send('subcoins error')

    }
})

app.post('/api/updatelevel', Authentication, async (req, res) => {
    const { level } = req.body;
    const user = req.user;
    const updatedlevel = await Users.findOneAndUpdate({ _id: user._id }, {
        level: level
    }, { returnDocument: 'after' });
    return res.status(200).json({ updatedlevel });
})

app.get('/api/showcompliments', Authentication, async (req, res) => {

    try {
        const user = req.user;
        const mycomplimments = await Splashanswer.find({ selected: user._id }).populate('Question').populate('selectedby', '_id Name Coins level Institute City State Gender');
        return res.status(200).json({ uid: user._id, mycomplimments: mycomplimments });
    } catch (error) {
        return res.status(500).send('compliments Error!');
    }

})

app.get('/api/getuser/:id', Authentication, async (req, res) => {
    try {
        const id = req.params.id;
        console.log(id);
        const user = await Users.findById(id);
        // console.log(user);
        return res.status(200).json({ user });
    } catch (error) {
        return res.status(500).send('user Error!');
    }
})

const referalcodegen = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let referralCode = '';
    for (let i = 0; i < 8; i++) {
        referralCode += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return referralCode
}

const recursioncode = async () => {
    const code = referalcodegen();
    const user = await Users.findOne({ referralcode: code });
    if (!user) {
        return code;
    }
    return recursioncode();
}

app.get('/api/referralcode', Authentication, async (req, res) => {
    try {
        const user = req.user;
        if (user.referralcode) {
            const referral = user.referralcode
            return res.status(200).send({ referral });
        }
        const referral = await recursioncode();
        const a = await Users.findOneAndUpdate({ _id: user.id }, {
            referralcode: referral
        })
        console.log(a);
        return res.status(200).json({ referral });
    } catch (error) {
        return res.status(500).send('user Error!');
    }
})

app.put('/api/dailybonus', Authentication, async (req, res) => {
    try {
        const user = req.user;

        if (user.bonusdate) {
            const time = user.bonusdate;
            const isdate = `${time.getFullYear()}/${time.getMonth() + 1}/${time.getDate()}`;
            const nowdate = new Date();
            const nowdateformate = `${nowdate.getFullYear()}/${nowdate.getMonth() + 1}/${nowdate.getDate()}`;
            if ((nowdateformate.localeCompare(isdate)) === 0) {
                return res.status(200).send('success today');
            }
        }
        const nowdate = new Date();
        const updateuser = await Users.findOneAndUpdate({ _id: user._id }, {
            Coins: user.Coins + 10,
            bonusdate: nowdate
        })

        const History = await Points.findOneAndUpdate({ userid: user._id }, {
            $push: {
                History: {
                    Date: new Date(),
                    Activity: "bonus",
                    Points: 10,
                }
            }
        });
        res.status(200).send('success');
    } catch (error) {
        res.status(500).send('daily bonus error');

    }

})

app.get('/api/pointshistory', Authentication, async (req, res) => {
    try {
        const user = req.user;
        const history = await Points.findOne({ userid: user._id })
        res.status(200).json({ history })
    } catch (error) {
        res.status(500).send(error.message);

    }
})

app.put('/api/updatemail', Authentication, async (req, res) => {
    try {
        const user = req.user;
        const { email } = req.body;
        const updateemail = await Users.findOneAndUpdate({ _id: user._id }, {
            Email: email
        }, { returnDocument: 'after' })
        const details = updateemail.Email;
        return res.status(200).json({ details });
    } catch (error) {
        res.status(500).send(error.message);

    }

})

app.post('/api/updateinstitute', Authentication, async (req, res) => {
    try {
        const user = req.user;
        const { Institute } = req.body;
        const updateInstitute = await Users.findOneAndUpdate({ _id: user._id }, {
            Institute: Institute
        }, { returnDocument: 'after' })
        const details = updateInstitute.Institute;
        return res.status(200).json({ details });
    } catch (error) {
        res.status(500).send(error.message);

    }

})

app.get('/api/getallusers', Authentication, async (req, res) => {
    try {
        const users = await Users.find({});
        console.log('users:', users.length);
        return res.status(200).json({ users });
    } catch (error) {
        return res.status(500).send('users Error!');
    }
})

// Gaming Part API's

// Function to create new slots
async function createNewSlots(totalSlots) {
    try {
        const currentTime = new Date();
        const startHour = 14;
        const startMinute = 30;
        const slotDuration = 5; // Duration of each slot in minutes
        // const totalSlots = 6; // Total number of slots to create

        for (let i = 0; i < totalSlots; i++) {
            // Set the start time for the slot
            const startTime = new Date(
                currentTime.getFullYear(),
                currentTime.getMonth(),
                currentTime.getDate(),
                startHour,
                startMinute + i * slotDuration
            );
            const endTime = new Date(startTime.getTime() + slotDuration * 60000); // Calculate the end time

            // Rest of the code remains the same
            quests = await GameQuestion.find({});
            const num = quests.length;

            const a = [];

            for (let i = 0; i < 10; i++) {
                a.push(Math.floor(Math.random() * num));
            }

            const questions = a.map((i) => quests[i]);

            const slot = new GameSlot({
                startTime,
                endTime,
                maxCapacity: 10,
                quizQuestions: questions,
            });

            await slot.save();
            console.log(`New slot ${i} created:`, slot);

            const timeUntilStart = startTime - currentTime;
            setTimeout(async () => {
                await markSlotAsStarted(slot._id);
            }, timeUntilStart);

            const timeUntilCompletion = endTime - currentTime;
            setTimeout(async () => {
                await markSlotAsCompleted(slot._id);
            }, timeUntilCompletion);


            setTimeout(async () => {
                await coinsdistribution(slot._id);
            }, timeUntilStart + 155 * 1000);
            console.log(timeUntilStart + 155 * 1000, `slot created ${i}`);
        }
    } catch (error) {
        console.log('Failed to create new slots:', error);
    }
}

// Function to mark a slot as started
async function markSlotAsStarted(slotId) {
    try {
        const slot = await GameSlot.findById(slotId);
        if (!slot) {
            console.log('Slot not found');
            return;
        }
        slot.status = 'started';
        await slot.save();
        console.log('Slot marked as started:', slot);
    } catch (error) {
        console.log('Failed to mark the slot as started:', error);
    }
}

// Function to mark a slot as completed
async function markSlotAsCompleted(slotId) {
    try {
        const slot = await GameSlot.findById(slotId);
        if (!slot) {
            console.log('Slot not found');
            return;
        }
        slot.status = 'completed';
        await slot.save();
        console.log('Slot marked as completed:', slot);
    } catch (error) {
        console.log('Failed to mark the slot as completed:', error);
    }
}

// Function to mark all incomplete slots as completed
async function markIncompleteSlotsAsCompleted() {
    try {
        const currentTime = new Date();

        // Find all slots that are not marked as completed and their end time has passed
        const incompleteSlots = await GameSlot.find({
            // status: { $ne: 'completed' },
            // endTime: { $lt: currentTime },
        });

        for (const slot of incompleteSlots) {
            slot.status = 'completed';
            await slot.save();
            // console.log('Slot marked as completed:', slot);
        }

        console.log('Marked all incomplete slots as completed.', incompleteSlots.length);
    } catch (error) {
        console.log('Failed to mark incomplete slots as completed:', error);
    }
}

// Manage slot automation schedulers
function scheduleSlotCreation() {

    // Schedule the new slot creation for every 5 minutes
    cron.schedule('30 13 * * *', async () => {
        await createNewSlots(6);
    });

    // Schedule the task to run every day at a specific time
    cron.schedule('30 16 * * *', async () => {
        await markIncompleteSlotsAsCompleted();
    });
}

// Get 6 Available Game Slots
app.get('/api/slots/available', Authentication, async (req, res) => {
    try {
        const slots = await GameSlot.find({ status: 'active' }).limit(6);
        console.log(slots);
        if (!slots) {
            return res.status(404).json({ message: 'No available slots found' });
        }
        res.status(200).json({ slots });
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve available slots' });
    }
});

// Join the user into a slot
app.post('/api/slots/join/:slotId', Authentication, async (req, res) => {
    try {
        const { slotId } = req.params;

        const user = req.user;

        const slot = await GameSlot.findById(slotId);

        if (!slot || !user) {
            return res.status(404).json({ error: 'Slot or user not found' });
        }

        if (slot.status !== 'active') {
            return res.status(403).json({ error: 'Slot is not available for joining' });
        }

        if (slot.currentMembers.length >= slot.maximumCapacity) {
            return res.status(403).json({ error: 'Slot is already full' });
        }

        // Reject if the user is already joined
        if (slot.currentMembers.includes(user._id)) {
            return res.status(200).json({ slot: slot, message: 'Already joined the slot' });
        }
        //  if the user doesn't have enough coins
        if (user.Coins < 200) {
            return res.status(401).json({ message: 'Not enough coins' });
        }

        const updatedcoins = await Users.findOneAndUpdate({ _id: user._id }, {
            Coins: user.Coins - 200,
        }, { returnDocument: 'after' });

        const b = await Points.findOneAndUpdate({ userid: user._id }, {
            $push: {
                History: {
                    Date: new Date(),
                    Activity: 'Game',
                    Points: 200,
                }
            }
        })


        // Add the user to the current members of the slot
        slot.currentMembers.push(user._id);

        console.log('User', user.Name, 'joined the slot:', slot._id);

        // Deduct the required coins from the user's account


        // Save the updated user and slot in the database
        // await Promise.all([user.save(), slot.save()]);
        await slot.save();

        res.status(200).json({ slot: slot, updatedcoins, message: 'User joined the slot successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to join the slot' });
    }
});

// Get Individual Slot Details (quizQuestions and Current Members)
app.get('/api/slots/:slotId', Authentication, async (req, res) => {
    try {
        const { slotId } = req.params;
        // console.log('Slot id ', slotId);
        const slot = await GameSlot.findById(slotId).populate('quizQuestions').populate('currentMembers');
        // console.log('Slot details ', slot);
        if (!slot) {
            return res.status(404).json({ error: 'Slot not found' });
        }
        // console.log('Slot details ', slot._id);
        res.status(200).json({ slot });
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve slot details' });
    }
});

// Submit Quiz answers of the user to the slot
app.post('/api/slots/submitquiz/:slotId', Authentication, async (req, res) => {
    try {
        const { slotId } = req.params;
        const { points, timeTaken } = req.body;
        const user = req.user;

        const slot = await GameSlot.findById(slotId);

        if (!slot) {
            return res.status(404).json({ error: 'Slot not found' });
        }
        if (!slot.currentMembers.includes(user._id)) {
            return res.status(403).json({ error: 'User is not a member of the slot' });
        }

        // Skip if the user has already submitted the quiz
        if (slot.quizResults.some((result) => result.participant.toString() === user._id.toString())) {
            return res.status(200).json({ slot: slot, message: 'Already submitted the quiz' });
        }

        // Add the quiz results to the slot
        slot.quizResults.push({ participant: user._id, points, timeTaken });

        // Save the updated slot in the database
        await slot.save();
        res.status(200).json({ slot: slot, message: 'Quiz submitted successfully' });

    } catch (error) {
        res.status(500).json({ error: 'Failed to submit the quiz' });
    }
});


async function coinsdistribution(slotId) {
    try {
        const slot = await GameSlot.findOne({ _id: slotId });
        console.log('coinsdistribution', slot._id);
        // Sort the quiz results based on points and time taken
        slot.quizResults.sort((a, b) => {
            if (a.points !== b.points) {
                return b.points - a.points; // Sort by points in descending order
            }
            return a.timeTaken - b.timeTaken; // Sort by time taken in ascending order
        });

        // If anyone did not submit quiz, then include them with 0 points, so that currentMembers is equal to quizresults
        if (slot.currentMembers.length > slot.quizResults.length) {
            slot.currentMembers.forEach((member) => {
                if (!slot.quizResults.some((result) => result.participant.toString() === member.toString())) {
                    slot.quizResults.push({ participant: member, points: 0, timeTaken: 0 });
                }
            });
        }

        // Calculate the reward points for each participant
        if (slot.quizResults.length > 2) {
            slot.quizResults.forEach(async (result, index) => {
                result.position = index + 1;
                if (index === 0) {
                    result.rewardPoints = slot.quizResults.length * 100;
                    const thisuser = await Users.findOne({ _id: result.participant });
                    const thisuserupdate = await Users.findOneAndUpdate({ _id: result.participant }, {
                        Coins: thisuser.Coins + slot.quizResults.length * 100,
                        level: thisuser.level + slot.quizResults.length * 100
                    });
                    const updatehistory = await Points.findOneAndUpdate({ userid: result.participant }, {
                        $push: {
                            History: {
                                Date: new Date(),
                                Activity: 'Quizwin',
                                Points: slot.quizResults.length * 100,
                            }
                        }
                    })
                } else if (index === 1) {
                    result.rewardPoints = slot.quizResults.length * 60;
                    const thisuser = await Users.findOne({ _id: result.participant });
                    const thisuserupdate = await Users.findOneAndUpdate({ _id: result.participant }, {
                        Coins: thisuser.Coins + slot.quizResults.length * 60,
                        level: thisuser.level + slot.quizResults.length * 60
                    });
                    const updatehistory = await Points.findOneAndUpdate({ userid: result.participant }, {
                        $push: {
                            History: {
                                Date: new Date(),
                                Activity: 'Quizwin',
                                Points: slot.quizResults.length * 60,
                            }
                        }
                    })
                } else if (index === 2) {
                    result.rewardPoints = slot.quizResults.length * 40;
                    const thisuser = await Users.findOne({ _id: result.participant });
                    const thisuserupdate = await Users.findOneAndUpdate({ _id: result.participant }, {
                        Coins: thisuser.Coins + slot.quizResults.length * 40,
                        level: thisuser.level + slot.quizResults.length * 40
                    });
                    const updatehistory = await Points.findOneAndUpdate({ userid: result.participant }, {
                        $push: {
                            History: {
                                Date: new Date(),
                                Activity: 'Quizwin',
                                Points: slot.quizResults.length * 40,
                            }
                        }
                    })
                } else {
                    result.rewardPoints = 0;
                }
            });
        }
        else if (slot.quizResults.length === 2) {
            slot.quizResults.forEach(async (result, index) => {
                result.position = index + 1;
                if (index === 0) {
                    result.rewardPoints = slot.quizResults.length * 200;
                    const thisuser = await Users.findOne({ _id: result.participant });
                    const thisuserupdate = await Users.findOneAndUpdate({ _id: result.participant }, {
                        Coins: thisuser.Coins + slot.quizResults.length * 200,
                        level: thisuser.level + slot.quizResults.length * 200
                    });
                    const updatehistory = await Points.findOneAndUpdate({ userid: result.participant }, {
                        $push: {
                            History: {
                                Date: new Date(),
                                Activity: 'Quizwin',
                                Points: slot.quizResults.length * 200,
                            }
                        }
                    })
                } else {
                    result.rewardPoints = 0;
                }
            });
        }
        else {
            slot.quizResults.forEach(async (result, index) => {
                result.position = index + 1;
                if (index === 0 && result.points >= 7) {
                    result.rewardPoints = slot.quizResults.length * 200;
                    const thisuser = await Users.findOne({ _id: result.participant });
                    const thisuserupdate = await Users.findOneAndUpdate({ _id: result.participant }, {
                        Coins: thisuser.Coins + slot.quizResults.length * 200,
                        level: thisuser.level + slot.quizResults.length * 200
                    });
                    const updatehistory = await Points.findOneAndUpdate({ userid: result.participant }, {
                        $push: {
                            History: {
                                Date: new Date(),
                                Activity: 'Quizwin',
                                Points: slot.quizResults.length * 200,
                            }
                        }
                    })
                } else {
                    result.rewardPoints = 0;
                }
            });
        }

        await slot.save();
    } catch (error) {
        console.log(error.message);
    }
}

// Displaying Results and Rewards
app.get('/api/slots/results/:slotId', Authentication, async (req, res) => {
    try {
        const { slotId } = req.params;
        const user = req.user;

        const slot = await GameSlot.findById(slotId).populate('quizResults.participant');

        if (!slot) {
            return res.status(404).json({ error: 'Slot not found' });
        }

        if (!slot.currentMembers.includes(user._id)) {
            return res.status(403).json({ error: 'User is not a member of the slot' });
        }

        // Prepare the response with position, participant details, points, and reward points
        const results = slot.quizResults.map((result) => ({
            position: result.position,
            participant: result.participant,
            points: result.points,
            rewardPoints: result.rewardPoints,
            timeTaken: result.timeTaken,
        }));

        res.status(200).json({ results });
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve quiz results' });
    }
});

// Adding new Questions into Database
app.post('/api/quiz/questions/add', async (req, res) => {
    try {
        const { question, options, correctAnswer } = req.body;

        const quest = new GameQuestion({
            question,
            options,
            correctAnswer,
        });

        await quest.save();

        res.status(200).json({ message: 'Question added successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add the question' });
    }
});

app.post('/uploadtimer', async (req, res) => {
    try {

        const audioPath = 'uploads/the-old-water-mill-meditation.mp3';

        const result = await cloudinary.uploader.upload(audioPath, {
            resource_type: 'auto',
            folder: 'audio_uploads'
        });

        const audioDuration = result.duration;

        const newAudio = new Audio({
            title: audioPath.split('uploads/')[1].split('.mp3')[0],
            url: result.secure_url,
            duration: audioDuration
        });

        await newAudio.save();
        res.status(200).send('Successfull');
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.post('/uploadmoodaudio', async (req, res) => {
    try {
        const audioPath = `uploads/anger-audio-1.mp3`;

        const result = await cloudinary.uploader.upload(audioPath, {
            resource_type: 'auto',
            folder: 'audio_uploads'
        });

        const audioDuration = result.duration;

        const newAudio = new AudioMood({
            title: audioPath.split('uploads/')[1].split('.mp3')[0],
            url: result.secure_url,
            duration: audioDuration,
            Mood: 'Angry'
        });

        await newAudio.save();
        res.status(200).send('Successfull');
    } catch (error) {
        res.status(500).send(error.message);
    }
});


app.get('/api/getalltracks', Authentication, async (req, res) => {
    try {
        const tracksarray = await Audio.find();
        console.log('he was here');
        res.status(200).json({ tracksarray })
    } catch (error) {
        res.status(500).send(error.message);

    }
})

app.get('/api/onetrack/:number', Authentication, async (req, res) => {
    try {
        let tracksarray = [];
        const { number } = req.params;
        const Moodarray = ['Motivated', 'Tired', 'Stressed', 'Panicked', 'Lazy', 'Angry']
        const tracksarrays = await AudioMood.find({ Mood: Moodarray[number - 1] });
        const i = Math.floor((Math.random() * tracksarrays.length));
        tracksarray.push(tracksarrays[i]);
        console.log(tracksarray);
        res.status(200).json({ tracksarray })
    } catch (error) {
        res.status(500).send(error.message);
    }
})

app.post('/api/addpoints', Authentication, async (req, res) => {
    try {
        const { coins, activity, time } = req.body;
        const user = req.user;
        const updatedcoins = await Users.findOneAndUpdate({ _id: user._id }, {
            Coins: user.Coins + coins,
            level: user.level + coins,
        }, { returnDocument: 'after' });
        const b = await Points.findOneAndUpdate({ userid: user._id }, {
            $push: {
                History: {
                    Date: new Date(),
                    Activity: activity,
                    Points: coins,
                    Duration: time
                }
            }
        })
        return res.status(200).json({ updatedcoins });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('addcoins error')

    }
})

// Payment API's
app.post('/api/payment', Authentication, async (req, res) => {
    try {
        const { amount, paymentId, coins } = req.body;
        const user = req.user;
        if (!user || !amount || !paymentId || !coins) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        const payment = new Payments({
            paymentId,
            userId: user._id,
            amount
        });
        const updateuser = await Users.findOneAndUpdate({ _id: user._id }, {
            Coins: user.Coins + coins
        });

        await payment.save();
        const History = await Points.findOneAndUpdate({ userid: user._id }, {
            $push: {
                History: {
                    Date: new Date(),
                    Activity: 'Buy',
                    Points: coins,
                }
            }
        });
        res.status(200).json({ message: 'Payment Successfully Updated' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update payment' });
    }
});

app.get('/api/allpayments', Authentication, async (req, res) => {
    try {
        const allpayments = await Payments.find({});
        res.status(200).json({ allpayments });
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve payments' });
    }
});

// Streak API's
app.post('/api/streakpost', Authentication, async (req, res) => {
    try {
        const user = req.user;
        const Time = new Date();
        const currentTime = new Date(Time.getFullYear(), Time.getMonth(), Time.getDate());
        if (
            user.Streaks.length > 0 &&
            user.Streaks[user.Streaks.length - 1].endDate.getFullYear() === currentTime.getFullYear() &&
            user.Streaks[user.Streaks.length - 1].endDate.getMonth() === currentTime.getMonth() &&
            user.Streaks[user.Streaks.length - 1].endDate.getDate() === currentTime.getDate()
        ) {
            console.log('Already Streak Added');
        }

        else if (
            user.Streaks.length > 0 &&
            user.Streaks[user.Streaks.length - 1].endDate.getFullYear() === currentTime.getFullYear() &&
            user.Streaks[user.Streaks.length - 1].endDate.getMonth() === currentTime.getMonth() &&
            user.Streaks[user.Streaks.length - 1].endDate.getDate() === (currentTime.getDate() - 1)
        ) {
            console.log('continue');
            user.Streaks[user.Streaks.length - 1].endDate = currentTime;
            const prevCoinday = user.Streaks[user.Streaks.length - 1].startDate.getDay();
            if (prevCoinday === currentTime.getDay()) {
                const c = user.Coins;
                user.Coins = 2 * c;
                const lev = user.level;
                user.level = lev + 500;
                const b = await Points.findOneAndUpdate({ userid: user._id }, {
                    $push: {
                        History: {
                            Date: new Date(),
                            Activity: "streak",
                            Points: c,
                        }
                    }
                }, {
                    returnDocument: 'after'
                })
                console.log(b);
            }

            user.save();
        }
        else {
            console.log('Started');
            user.Streaks.push({ startDate: currentTime, endDate: currentTime });
            user.save();
        }
        res.status(200).send('successfull');
    } catch (error) {
        res.status(500).send(error.message);

    }
})

app.post('/api/streakicy', Authentication, async (req, res) => {
    try {
        const user = req.user;

        if (user.Coins < 200) {
            return res.status(400).send('not enough coins');
        }

        if (new Date(user?.Icy) > new Date()) {
            return res.status(404).send('Icy not available');
        }

        let check = new Date();
        const checkDate = new Date(check.getFullYear(), check.getMonth(), check.getDate() + 7);


        if (user.Streaks.length < 1) {
            return res.status(404).send('not found Streak');
        }
        const updatedate = user.Streaks[user.Streaks.length - 1].startDate;
        const currentTime = new Date(updatedate.getFullYear(), updatedate.getMonth(), updatedate.getDate() - 1);
        console.log(currentTime);
        if (
            user.Streaks.length > 1 &&
            user.Streaks[user.Streaks.length - 2].endDate.getFullYear() === currentTime.getFullYear() &&
            user.Streaks[user.Streaks.length - 2].endDate.getMonth() === currentTime.getMonth() &&
            user.Streaks[user.Streaks.length - 2].endDate.getDate() === currentTime.getDate() - 1
        ) {
            user.Streaks[user.Streaks.length - 2].endDate = user.Streaks[user.Streaks.length - 1].endDate;
            console.log(user.Streaks.pop())
            user.Icy = checkDate;
            const c = user.Coins;
            user.Coins = c - 200;
            user.save();
            const b = await Points.findOneAndUpdate({ userid: user._id }, {
                $push: {
                    History: {
                        Date: new Date(),
                        Activity: "Icy",
                        Points: 200,
                    }
                }
            }, {
                returnDocument: 'after'
            })
            console.log(b);

        }
        else {
            user.Streaks[user.Streaks.length - 1].startDate = currentTime;
            user.Icy = checkDate;
            const c = user.Coins;
            user.Coins = c - 200;
            user.save();
            const b = await Points.findOneAndUpdate({ userid: user._id }, {
                $push: {
                    History: {
                        Date: new Date(),
                        Activity: "Icy",
                        Points: 200,
                    }
                }
            }, {
                returnDocument: 'after'
            })
            console.log(b);
        }

        res.status(200).send('successfull');

    } catch (error) {
        res.status(500).send(error.message);

    }
})

app.post('/api/activitycoins', Authentication, async (req, res) => {
    try {
        const user = req.user;
        console.log('dddd');
        const { coins, activity } = req.body;
        console.log(coins);
        user.Coins = user.Coins + coins;
        const updatecoins = await Points.findOneAndUpdate({ userid: user._id }, {
            $push: {
                History: {
                    Date: new Date(),
                    Activity: activity,
                    Points: coins,
                }
            }
        });
        // console.log(updatecoins);
        await user.save();
        console.log('sss');
        res.status(200).send('success');
    } catch (error) {
        console.log(error.message);
        res.status(500).send('error');
    }
})

app.get('/api/getsleepmusic', Authentication, async (req, res) => {
    try {
        const getAudio = await AudioSleep.find({});
        const a = Math.floor((Math.random() * getAudio.length));
        var tracksarray = [];
        tracksarray.push(getAudio[a]);
        return res.status(200).json({ tracksarray });
    } catch (error) {
        res.status(500).send('error');
    }
})


// Groups API's

// Create new Group
app.post('/api/groups/create', Authentication, async (req, res) => {
    console.log('create group');
    try {
        const { name, description, type, temporary } = req.body;
        const user = req.user;
        // console.log(req.body, req.user);
        if (!name || !description || !type || !temporary) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        const group = new Group({
            name,
            description,
            type,
            temporary,
            createdBy: user._id,
            members: [user._id],
        });
        // console.log(group);
        await group.save();

        // If the group is temporary, then set auto deletion after 24h
        if (temporary) {
            setTimeout(async () => {
                await group.deleteOne();
                console.log('Group deleted successfully', group);
            }, 24 * 60 * 60 * 1000);
        };

        // console.log('Group created successfully', group);
        res.status(200).json({ message: 'Group created successfully', group: group });
    } catch (error) {
        console.log(error);
        console.log(error.message);
        res.status(500).json({ error: 'Failed to create group' });
    }
});

// Find all Public Groups
app.get('/api/groups/public', Authentication, async (req, res) => {
    try {
        // Get the groups that are public and the user not joined in
        const groups = await Group.find({ type: 'public', members: { $ne: req.user._id } });
        res.status(200).json({ groups });
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve public groups' });
    }
});

// Get details of a Group
app.get('/api/group/:groupId', Authentication, async (req, res) => {
    try {
        const { groupId } = req.params;
        const user = req.user;
        if (!groupId) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        // Populate the group with the members in the group to get their names Coins and level
        const group = await Group.findById(groupId).populate('members', 'Name Coins level');

        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }
        // Check if the user is a member of the group
        if (!group.members.includes(user._id)) {
            return res.status(403).json({ error: 'User is not a member of the group' });
        }
        res.status(200).json({ group });
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve group details', error: error.message });
    }
});

// Join member to a Group
app.get('/api/group/join/:groupId', Authentication, async (req, res) => {
    try {
        const { groupId } = req.params;
        const user = req.user;

        // Search Group with given groupId
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }
        // console.log(group);
        // Check if the user is a member of the group
        if (group.members.includes(user._id)) {
            return res.status(403).json({ error: 'User is already a member of the group' });
        }
        // Add the user to the group
        group.members.push(user._id);
        await group.save();
        res.status(200).json({ message: 'Member added to the group successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to add member to group', error: error.message });
    }
});

// Get statistics of the members in a group
app.get('/api/group/stats/:groupId', Authentication, async (req, res) => {
    try {
        const { groupId } = req.params;
        const user = req.user;
        // Search Group with given groupId
        const group = await Group.findById(groupId);
        // console.log(group);
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }
        // Check if the user is a member of the group
        if (!group.members.includes(user._id)) {
            return res.status(403).json({ error: 'User is not a member of the group' });
        }
        // Get the statistics of the members in the group
        // const stats = await Group.aggregate([
        //     { $match: { _id: groupId } },
        //     { $unwind: '$members' },
        //     {
        //         $lookup: {
        //             from: 'users',
        //             localField: 'members',
        //             foreignField: '_id',
        //             as: 'memberDetails',
        //         },
        //     },
        //     { $unwind: '$memberDetails' },
        //     {
        //         $project: {
        //             _id: 0,
        //             'memberDetails._id': 1,
        //             'memberDetails.Name': 1,
        //             'memberDetails.Coins': 1,
        //             'memberDetails.level': 1,
        //         },
        //     },
        // ]);

        // get Leaderboard for the group menmbers
        const stats = await Users.find({ _id: { $in: group.members } }).sort({ Coins: -1 }).select('Coins level Name');
        console.log(stats);
        res.status(200).json({ stats });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Failed to retrieve group statistics' });
    }
});

// Get all Groups of a User
app.get('/api/groups', Authentication, async (req, res) => {
    try {
        const user = req.user;
        const groups = await Group.find({ members: user._id });
        res.status(200).json({ groups });
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve groups' });
    }
});


app.post('/api/sendrequest', Authentication, async (req, res) => {
    try {
        const { id } = req.body;
        const user = req.user;
        if (!id) {
            return res.status(401).json({ message: 'id is empty' });
        }
        const updateRequests = await new Friends({
            Sender: user._id,
            Receiver: id,
            Time: new Date(),
            Type: 'Requested'
        })

        await updateRequests.save();

        return res.status(200).send('Sucessfull');
    } catch (error) {

        res.status(500).send('Requests error')

    }
})

app.post('/api/acceptrequest', Authentication, async (req, res) => {
    try {
        const { id } = req.body;
        const user = req.user;
        if (!id) {
            return res.status(401).json({ message: 'id is empty' });
        }

        const updateFriends = await Friends.findOneAndUpdate({ _id: id }, {
            Type: 'Confirmed',
            Time: new Date()
        }, { returnDocument: 'after' })
        console.log(updateFriends);
        return res.status(200).send('Sucessfull');
    } catch (error) {

        res.status(500).send('Requests error')

    }
})

app.delete('/api/deleterequest', Authentication, async (req, res) => {
    try {
        const { id } = req.body;
        const user = req.user;
        if (!id) {
            return res.status(401).json({ message: 'id is empty' });
        }
        const updateRequests = await Friends.deleteOne({ _id: id });
        console.log(updateRequests);
        return res.status(200).send('Sucessfull');
    } catch (error) {

        res.status(500).send('Requests error')

    }
});

app.post('/api/unfriend', Authentication, async (req, res) => {
    try {
        const { id } = req.body;
        const user = req.user;
        if (!id) {
            return res.status(401).json({ message: 'id is empty' });
        }
        const updateFriends = await Friends.deleteOne({ Sender: user._id, Receiver: id });
        if (updateFriends.deletedCount === 0) {
            console.log('1');
            const updateFriends2 = await Friends.deleteOne({ Receiver: user._id, Sender: id });
        }

        return res.status(200).send('Sucessfull');
    } catch (error) {

        res.status(500).send('Requests error')

    }
})


app.get('/api/myfriends', Authentication, async (req, res) => {
    try {
        const user = req.user;
        let friends = [];
        const findFriends = await Friends.find({ Sender: user._id, Type: 'Confirmed' }).populate('Receiver');
        for (let i = 0; i < findFriends.length; i++) {
            friends.push(findFriends[i].Receiver);

        }
        const findFriends2 = await Friends.find({ Receiver: user._id, Type: 'Confirmed' }).populate("Sender");
        for (let i = 0; i < findFriends2.length; i++) {
            friends.push(findFriends2[i].Sender);

        }
        res.status(200).json({ friends });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Requests error');

    }
})

app.get('/api/myrequest', Authentication, async (req, res) => {
    try {
        const user = req.user;
        const requests = await Friends.find({ Receiver: user._id, Type: 'Requested' }).populate('Sender');
        res.status(200).json({ requests });

    } catch (error) {

        res.status(500).send('Requests error');

    }
})

app.get('/api/sentrequest', Authentication, async (req, res) => {
    try {
        const user = req.user;
        const sentrequests = await Friends.find({ Sender: user._id, Type: 'Requested' }).populate('Receiver');
        res.status(200).json({ sentrequests });
    } catch (error) {

        res.status(500).send('Requests error');

    }
})


app.get('/api/profileuser', Authentication, async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.body;
        const sentrequests = await Friends.find({ Sender: user._id, Type: 'Requested' }).populate('Receiver');
        res.status(200).json({ sentrequests });
    } catch (error) {

        res.status(500).send('Requests error');

    }
})

app.get('/api/friendnumber/:id', Authentication, async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const findFriends = await Friends.find({ Sender: id, Type: 'Confirmed' })
        const findFriends2 = await Friends.find({ Receiver: id, Type: 'Confirmed' })
        const len = findFriends.length + findFriends2.length;
        res.status(200).json({ len });

    } catch (error) {

        res.status(500).send('Requests error');

    }
})

app.get('/api/splashnumber/:id', Authentication, async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const splashnumber = await Splashanswer.find({ selected: id });
        const len = splashnumber.length;
        res.status(200).json({ len });
    } catch (error) {

        res.status(500).send('Requests error');

    }
})

app.get('/api/myfriendnumber', Authentication, async (req, res) => {
    try {
        const user = req.user;
        const findFriends = await Friends.find({ Sender: user._id, Type: 'Confirmed' })
        const findFriends2 = await Friends.find({ Receiver: user._id, Type: 'Confirmed' })
        const len = findFriends.length + findFriends2.length;
        res.status(200).json({ len });

    } catch (error) {

        res.status(500).send('Requests error');

    }
})

app.get('/api/mysplashnumber', Authentication, async (req, res) => {
    try {
        const user = req.user;

        const splashnumber = await Splashanswer.find({ selected: user._id });
        const len = splashnumber.length;
        res.status(200).json({ len });
    } catch (error) {

        res.status(500).send('Requests error');

    }
})

app.post('/api/contactsuggestion', Authentication, async (req, res) => {
    try {
        const { contact } = req.body;
        const user = req.user;
        // console.log(contact);
        if (!contact) {
            return res.status(401).json({ message: 'id is empty' });
        }
        let contactArray = [];
        for (let i = 0; i < contact.length; i++) {
            const { phoneNumbers } = contact[i];
            const { number } = phoneNumbers[0];
            const Number = await number.replace(/[^+\d]+/g, "");

            const a = await Users.findOne({ Phone: Number });
            if (a) {
                const b = await Friends.findOne({ Sender: a, Receiver: user._id });
                const c = await Friends.findOne({ Sender: user._id, Receiver: a });
                if (!b && !c) {
                    if (String(user._id) !== String(a._id)) {
                        contactArray.push(a);
                    }
                }

            }

        }

        return res.status(200).json({ contactArray });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Requests error')

    }
})

app.post('/api/friendstatus', Authentication, async (req, res) => {
    try {
        const { id } = req.body;
        const user = req.user;

        if (!id) {
            return res.status(401).json({ message: 'id is empty' });
        }

        if (String(id) === String(user._id)) {
            return res.status(200).json({ message: "Profile" })
        }
        const a = await Friends.findOne({ Sender: id, Receiver: user._id });
        if (!a) {
            const b = await Friends.findOne({ Sender: user._id, Receiver: id });
            if (!b) {
                return res.status(200).json({ message: "Add" })
            }
            return res.status(200).json({ message: b.Type === "Requested" ? "Cancel" : "Unfriend", Friendsid: b._id });

        }
        return res.status(200).json({ message: a.Type === "Requested" ? "Accept" : "Unfriend", Friendsid: a._id });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Requests error')

    }
})

app.post('/api/search', Authentication, async (req, res) => {
    try {
        const { search } = req.body;
        const string = search.replace(/\\/g, "\\\\");
        const regex = new RegExp(string, 'i');
        const searchresult = await Users.find({
            $or: [{ Name: regex }, { Institute: regex }]
        });
        res.status(200).json({ searchresult });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('error');

    }
})

app.listen(port, () => {
    console.log(`server is running on port ${port}....`);
    scheduleSlotCreation();
});
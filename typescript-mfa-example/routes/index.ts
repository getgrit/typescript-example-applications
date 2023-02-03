import express, { Application, Request, Response, Router } from 'express'
import WorkOS from '@workos-inc/node'
import { Factor } from '@workos-inc/node/lib/mfa/interfaces/factor.interface'
import { VerifyResponse } from '@workos-inc/node/lib/mfa/interfaces/verify-challenge-response'

const app: Application = express()
const router: Router = express.Router()
const session: any = require('express-session')

app.use(
    session({
        secret: 'keyboard cat',
        resave: false,
        saveUninitialized: true,
        cookie: { secure: true }
    }))

const workos: WorkOS = new WorkOS(process.env.WORKOS_API_KEY)
let factors: Factor[] = session.factors = []

router.get('/', async (req: Request, res: Response) => {
    res.render('index.ejs', {
        title: 'Home',
        factors: factors,
    })
})

router.get('/enroll_factor', (req: Request, res: Response) => {
    res.render('enroll_factor.ejs')
})

router.post('/enroll_new_factor', async (req: Request, res: Response) => {
    if (req.body.type === 'sms') {
        const phone_number: string = req.body.phone_number

        const new_factor: Factor = await workos.mfa.enrollFactor({
            type: 'sms',
            phoneNumber: phone_number,
        })
        factors.push(new_factor)
    } else {
        const new_factor: Factor = await workos.mfa.enrollFactor({
            type: 'totp',
            issuer: req.body.totp_issuer,
            user: req.body.totp_user,
        })
        factors.push(new_factor)
    }
    res.redirect('/')
})

router.get('/factor_detail/:id', async (req: Request, res: Response) => {
    const factor = factors.filter((factor) => {
        return factor.id == req.params.id
    })[0]

    session.current_factor = factor
    res.render('factor_detail.ejs', { title: 'Factor Detail', factor: factor })
})

router.post('/challenge_factor', async (req: Request, res: Response) => {
    if (session.current_factor.type === 'sms') {
        let message = req.body.sms_message
        session.sms_message = message

        const challenge = await workos.mfa.challengeFactor({
            authenticationFactorId: session.current_factor.id,
            smsTemplate: message,
        })
        session.challenge_id = challenge.id
    }

    if (session.current_factor.type === 'totp') {
        const challenge = await workos.mfa.challengeFactor({
            authenticationFactorId: session.current_factor.id
        })
        session.challenge_id = challenge.id
    }

    res.render('challenge_factor.ejs', { title: 'Challenge Factor' })
})

router.post('/verify_factor', async (req: Request, res: Response) => {
    const buildCode = (codeItems: { [key: string]: string }) => {
        let code: string[] = []
        for (const item in codeItems) {
            code.push(codeItems[item])
        }
        return code.join('')
    }
    const code: string = buildCode(req.body)
    const challenge_id: string = session.challenge_id

    const verify_factor: VerifyResponse = await workos.mfa.verifyChallenge({
        authenticationChallengeId: challenge_id,
        code: code,
    })

    res.render('challenge_success.ejs', { title: 'Challenge Success', verify_factor: verify_factor })
})

router.get('/clear_session', (req, res) => {
    factors = []
    res.redirect('/')
})

export default router
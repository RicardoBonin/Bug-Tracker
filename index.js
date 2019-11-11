const express = require('express')
const app = express()
const path = require('path')
const bodyParser = require('body-parser')
const { promisify } = require('util')
const sgMail= require( '@sendgrid/mail' )

const GoogleSpreadsheet = require('google-spreadsheet')
const credentials = require('./bugtracker.json')

//configuraçoes
const docId = '1rNKvJwd0wy7SZb70gHaqRxnsd3JArPixvk6DhYlMThY'
const worksheetIndex = 0
const SendGridKey = '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'

app.set('view engine', 'ejs')
app.set('views', path.resolve(__dirname, 'views'))

app.use(bodyParser.urlencoded({ extended: true }))

app.get('/', (request, response) => {
    response.render('home')
})
app.post('/', async(request, response) => {
    try{
        const doc = new GoogleSpreadsheet(docId)
        await promisify (doc.useServiceAccountAuth)(credentials)
        const info = await promisify(doc.getInfo)()
        const worksheet = info.worksheets[worksheetIndex]
        await promisify(worksheet.addRow)({
            name: request.body.name,
            email: request.body.email,
            issueType: request.body.issueType,
            howToReproduce: request.body.howToReproduce,
            experctOuput: request.body.experctOuput,
            receivedOuput: request.body.receivedOuput,
            userAgent: request.body.userAgent,
            userDate: request.body.userDate
        })

        //se for critico
        if (request.body.issueType === 'CRITICAL') {
            sgMail.setApiKey(SendGridKey)
            const msg = {
                to: 'ricardo@brittes.com.br',
                from: 'ricardo@brittes.com.br',
                subject: 'BUG Critico reportado',
                text: `
                    O usuário ${request.body.name} reportou um problema.
                `,
                html: `O usuário ${request.body.name} reportou um ploblema.`
            }
            await sgMail.send(msg)
        }
        response.render('success')
    } catch (err) {
        response.send('Erro ao enviar formulário')
        console.log(err)
    }
})

app.listen(3000, (err => {
    if (err) {
        console.log('aconteceu um erro!', err)
    } else {
        console.log('bugtracker rodando na porta http://localhost:3000')
    }
}))
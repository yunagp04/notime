const { app } = require('@azure/functions');

app.setup({
    enableHttpStream: true,
});

// module.exports = async function (context, req) {
//     const word = req.body?.word;

//     context.res = {
//         status: 200,
//         body: {
//             ok: true,
//             word
//         }
//     };
// };
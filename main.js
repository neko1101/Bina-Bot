const { Telegraf } = require('telegraf');
const axios = require('axios');
const cheerio = require('cheerio');
const schedule = require("node-schedule");
let job
let getDataJob

const bot = new Telegraf(process.env.BOT_KEY);
bot.start((ctx) => {
    console.table(ctx)
    console.log(ctx.message)
    ctx.reply('Welcome')
});


bot.help((ctx) => ctx.reply('Send me a sticker'));
bot.on('sticker', (ctx) => ctx.reply('👍'));
bot.hears('hi', (ctx) => ctx.reply('Hey there'));
bot.launch()
console.log("Bot Running!")

// Testing cron lib
bot.command('schedule', (ctx) => {
    job = schedule.scheduleJob('*/1 * * * *', () => {
        ctx.reply("This is scheduled message every 1 minute...");
        console.log("Message sent to chat id: " + ctx.message.chat.id)
    });
    ctx.reply("Scheduling completed, you will receive update every 1 minute.")
})

bot.command("stop", (ctx) => {
    if(job) {
        job.cancel()
        ctx.reply("Scheduling stopped!")
    } else {
        ctx.reply("No schedule at the moment...")
    }
})

bot.command("gold_24k", (ctx) => {
    getPrice().then(res => {
        console.log(res)
        ctx.reply(`
        \nEffective Date: ${res.effective_date} \nLast updated: ${res.last_updated} \n\n- Forex - \nBNM buy/g: RM ${res.bnm_buy_g} \nBNM sell/g: RM ${res.bnm_sell_g} \n\n- Retail - \nPG buy/g: RM ${~~res.pg_buy_g} \nPG sell/g: RM ${~~res.pg_sell_g}
        `, {
            reply_to_message_id: ctx.message.message_id,
            parse_mode: 'HTML'
        })
    })
})

// sample metion
bot.command("maki", (ctx) => {
    ctx.reply("Bugima lu @pakiula")
})

function getPrice() {
    const one_oz = 28.35;
    const config = {
        headers:{
          Accept: 'application/vnd.BNM.API.v1+json'
        }
    };

    let data
    return axios.get('https://api.bnm.gov.my/public/kijang-emas', config)
    .then(res => {
        const bnm_buy_oz = res.data.data.one_oz.buying
        const bnm_sell_oz = res.data.data.one_oz.selling
        const effective_date = res.data.data.effective_date
        const last_updated = res.data.meta.last_updated
        const bnm_buy_g = (bnm_buy_oz/one_oz).toFixed(2)
        const bnm_sell_g = (bnm_sell_oz/one_oz).toFixed(2)
        const pg_buy_g = (+bnm_buy_g  - (+bnm_buy_g)/100*11).toFixed(2)
        const pg_sell_g = (+bnm_sell_g  - (+bnm_sell_g)/100*7).toFixed(2)

        const gold_data_24k = {
            effective_date,
            last_updated,
            bnm_buy_g,
            bnm_sell_g,
            pg_buy_g,
            pg_sell_g
        }
        return gold_data_24k
    })
}

// Using cheerio
function get_pg_price() {
    // pg buy - 11%
    // pg sell - 7%
    axios.get('https://publicgold.com.my/')
    .then((response) => {
        const html = response.data
        const $ = cheerio.load(html)
        
        $('td:contains(= 1.0000 gram)', html).each(function() {
            const text = $(this).text()
            if(text.length > 0){
                console.log(text.trim())
            }
        })
    }).catch((err) => console.log(err))
}

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGINT', () => schedule.gracefulShutdown());
process.once('SIGTERM', () => bot.stop('SIGTERM'));
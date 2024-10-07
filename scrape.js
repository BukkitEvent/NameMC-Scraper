// make sure to use a proxy/vpn in case
let delay = 50 // delay per page finding, 1000 is recommended
let page = 1
let total = 0

const fs = require('fs')

const types = [
    '/trending/daily',
    '/trending/weekly',
    '/trending/monthly',
    //'/trending/top', // it doesnt show username
    '/new',
]

let currentType = types[0]
let typeIndex = 0

async function scrape() {
    const scrapedHTMLData = (await (await fetch(`https://namemc.com/minecraft-skins${currentType}?page=${page}`, {
        "headers": {
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
            "accept-language": "en,cs;q=0.9",
            "cache-control": "max-age=0",
            "Referer": "https://namemc.com/",
            "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        "body": null,
        "method": "GET"
    })).text()).split('\n')
    
    const players = []

    let unlogged = 0

    scrapedHTMLData.map(line => {
        if(
            /<span class="">.*<\/span>/g.test(line)
        ) {
            players.push(
                line.replace(/<span class="">/g, '')
                    .replace(/ /g, '')
                    .replace(/<.*/g, '')
            )
        }
    })

    total += players.length

    const content = fs.readFileSync('./player-list.txt', 'utf-8')

    if(players.length == 0) {
        const originalDelay = delay
        delay = 6000
        console.log(`[NameMC${currentType}] Rate limited! Waiting 6 seconds`)
        setTimeout(() => {
            delay = originalDelay
        }, 6000)
        setTimeout(scrape, delay)
        return
    }

    for(const name of players) {
        if(!content.split('\n').includes(name)) { // write if its not in there
            unlogged++
            fs.writeFileSync('./player-list.txt', fs.readFileSync('./player-list.txt') + name + '\n')
        }
    }

    console.log(`[NameMC${currentType}] Page ${page} - Scraped ${unlogged} unlogged usernames | ${players.length} usernames | Total: ${total}`)

    page++
    if(page >= 50) {
        page = 1
        doNew = true
        console.log(`[NameMC] Wave ${currentType} scraped!`)
        if(currentType == types[types.length-1]) return console.log(`[NameMC] All waves scraped. Goodbye!`)
        typeIndex += 1
        currentType = types[typeIndex]
        console.log(`[NameMC] Next wave: ${currentType}`)
    }
    setTimeout(scrape, delay)
}

scrape()

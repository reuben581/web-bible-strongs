import fs from 'node:fs'; 

const dir = './chapter-data';
const data = String(fs.readFileSync('./JOHN-001-021-strongs-grammar.csv'))
const rows = data.split('\n')

const extract = function (chapter, verse, words) {
    
    // Greek, strongs, grammar
    for (let i = 0; i < words.length - 1; i += 3) {
        const greek = words[i]
        const strongs = `G${words[i + 1]}`
        let grammar = words[i + 2]
        if (grammar) {grammar = grammar.slice(1, -1)}
        const word = (i / 3) + 1
        
        const entry = JSON.stringify({
            chapter: Number(chapter),
            verse: Number(verse),
            word,
            greek,
            english: '',
            strongs,
            grammar
        }, null, 4);

        
        const chapterPad = `${chapter.padStart(2, '0')}`;
        const file = `john-${chapterPad}.json`;
        
        // console.log(entry)
        // console.log(`${dir}/${file}`)

        fs.appendFileSync(`${dir}/${file}`, `${entry},\n`);
    }
}

for (let r = 0; r < rows.length; r += 1) {
    const row = rows[r]
    const [chapter, verse, words] = row.split(',')
    extract(chapter, verse, words.split(' '))
}


// console.log(lines)

// // console.log(chapters[1])
// Object.entries(chapters).forEach(([chapter, chapterData]) => {
//     if (!isNaN(chapter)) {
//         const dir = './chapter-data';
//         const chapterPad = `${String(chapter).padStart(2, '0')}`;
//         const file = `john-${chapterPad}.json`;
//         const outJson = JSON.stringify(chapterData, null, 3);
//         console.log(chapter, dir, file, outJson)
//         // fs.writeFileSync(`${dir}/${file}`, outJson);
//     }
// })
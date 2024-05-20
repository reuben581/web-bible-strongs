import fs from 'node:fs'; 
import {parse} from 'csv';

const csvData = [];
const chapters = {};

fs.createReadStream('./JOHN-001-021-strongs-grammar.csv')
    .pipe(parse({delimiter: ','}))
    .on('data', function(csvrow) {
        csvData.push(csvrow);        
    })
    .on('end',function() {
        let lastChapter = 0;
        
        csvData.forEach(row => {
            if (row < 1) {
                return
            }
            
            const chapter = Number(row[0])
            const verse = Number(row[1])
            const words = row[2].split(' ')
            
            if (lastChapter !== chapter) {
                chapters[chapter] = [];
            }
            
            // Greek, strongs, grammar
            for (let i = 0; i < words.length - 1; i += 3) {
                const greek = words[i]
                const strongs = `G${words[i + 1]}`
                let grammar = words[i + 2]
                if (grammar) {grammar = grammar.slice(1, -1)}
                // console.log(greek, strongs, grammar)

                chapters[chapter].push({
                    chapter,
                    verse,
                    word: (i / 3) + 1,
                    greek,
                    english: '',
                    strongs,
                    grammar
                });
            }
        })

        // console.log(chapters[1])
        Object.entries(chapters).forEach(([chapter, chapterData]) => {
            if (isNaN(chapter)) {
                return
            }
            const dir = './chapter-data';
            const chapterPad = `${String(chapter).padStart(3, '0')}`;
            const file = `john-${chapterPad}.json`;
            const outJson = JSON.stringify(chapterData, null, 4);
            // console.log(chapter, dir, file, outJson)
            fs.writeFileSync(`${dir}/${file}`, outJson);
        })
    });
#!/usr/bin/env node
import colors from 'colors';

const args = process.argv.slice(2);

const chapter = `${args[0]}`.padStart(3, '0');
const verse = args[1];
console.log(`Mark ${args[0]}:${verse}`);
console.log('_____________________________________')

const filePath = `./books/41-mark/mark-${chapter}.mjs`;

const data = (await import(filePath)).default;
// console.log(data)

const words = [];

data.forEach(word => {
    if (word.chapter === Number(chapter) &&
        word.verse === Number(verse)) {
            words.push(word);
        }
})

const maxLen = ({greek, english, strongs, grammar}) => {
    const ary = [greek, english, strongs, grammar];
    
    const length = ary.sort((a, b) => {
        return b.length - a.length;
    })[0].length;

    return length;
}

words.forEach(word => {
    if (word.chapter === Number(chapter) &&
        word.verse === Number(verse)) {
            const len = maxLen(word);
            const col = colors[word.christ && 'red' || 'white'];

            process.stdout.write(col(word.english.padEnd(len, ' ')))
            if (word.word < words.length) {
                process.stdout.write(' ');
            }
        }
})
process.stdout.write('\n')

words.forEach(word => {
    if (word.chapter === Number(chapter) &&
        word.verse === Number(verse)) {
            const len = maxLen(word);
            const col = colors[word.christ && 'red' || 'white'];
            
            process.stdout.write(col(word.greek.padEnd(len, ' ')))
            if (word.word < words.length -1) {
                process.stdout.write(' ');
            }
        }
})
process.stdout.write('\n')

words.forEach(word => {
    if (word.chapter === Number(chapter) &&
        word.verse === Number(verse)) {
            const len = maxLen(word);
            const col = colors[word.christ && 'red' || 'white'];
            
            process.stdout.write(col(word.strongs.padEnd(len, ' ')))
            if (word.word < words.length -1) {
                process.stdout.write(' ');
            }
        }
})
process.stdout.write('\n')

words.forEach(word => {
    if (word.chapter === Number(chapter) &&
        word.verse === Number(verse)) {
            const len = maxLen(word);
            const col = colors[word.christ && 'red' || 'white'];
            
            process.stdout.write(col(word.grammar.padEnd(len, ' ')))
            if (word.word < words.length -1) {
                process.stdout.write(' ');
            }
        }
})
process.stdout.write('\n')

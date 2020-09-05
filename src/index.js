// Writing a parser or a lexer or something

/* eslint-disable no-fallthrough */

/*
Test Cases:

// works
title="foo bar"
title="another title here"
title="A title with "double quotes in it""
*/
let titleRegex = new RegExp('title="(.+)"');
/*
Test Cases:

// works
#foo
#bar
#foo#bar#blah
#foo #bar
#foo test here

// still works

#🧠
#it-works!!!

// doesn't work

### A heading
# A heading
## A heading
#### A heading

// doesn't work

[#foo](./within-a-link)
[foo](#within-a-link)

// doesn't work
`#foo`
*/
let tagRegex = new RegExp("(?<![#[(])#([^#\\s]+)");
/**
 * Matches:
 *   **bold text**
 */
let boldRegex = new RegExp("\\*\\*(.+)\\*\\*");
/**
 * Matches:
 *   __italics text__
 */
let italicsRegex = new RegExp("__(.+)__");

/**
 * Matches:
 *   ~~striken text~~
 */
let strikethroughRegex = new RegExp("~~(.+)~~");
/**
 * Matches:
 * Either a tab, or two spaces - 0 or more times
 * Either:
 *   [ ]
 *   [~]
 *   [X]
 *   [x]
 * Followed by a space, and then followed by any characters but not a tab or line break
 */
let todoRegex = new RegExp("^(\\t|\\s{2,}){0,}\\[([ xX~])\\] (.+[^s])", "m");
/**
 * Matches:
 * * thing
 *   * nested thing
 * - dash list
 *   - dash list
 */
let regularBulletsRegex = new RegExp(
  "^(\\t|\\s{2,}){0,}([\\*\\-]) {0,}(.+)",
  "m"
);
/**
 * Matches:
 * 1. Thing
 *   2. another thing
 * a. thing
 *   b. another thing
 * A. thing
 *   B. another
 */
let characterBulletsRegex = new RegExp(
  "^(\\t|\\s{2,}){0,}([a-zA-Z0-9])\\. {1,}(.+)",
  "m"
);
/**
 * Matches:
 * `code`
 *
 * Does not match:
 * `code \`with\` escaped backticks` correctly
 */
let inlineCodeRegex = new RegExp("`([^`]+)`");

/**
 * Matches:
 * [some link](anchor here)
 * [another](link) [here](too)
 * Doesn't Match:
 * ![some image](image.png)
 */
let linkRegex = new RegExp("(?<!\\!)\\[(.*?)\\]\\((.*?)\\)");

/**
 * Matches:
 * ![some image](image.png)
 * Doesn't Match:
 * [some link](page)
 */
let imageRegex = new RegExp("\\!\\[(.*?)\\]\\((.*?)\\)");
/**
 * Matches:
 * # A heading
 * ## A heading
 * ### A heading
 * #### A heading
 * ##### A heading
 * ###### A heading
 * ...
 *
 * Doesn't Match:
 * `# a heading`
 * #tag-here
 */
let markdownHeadingRegex = new RegExp("(?<!`)(#+) (.*)");

/**
 * Matches:
 * ```
 * some code
 * ```
 * ```jsx
 * more code
 * ```
 * ~~~language
 * some more code
 * ~~~
 */
let markdownCodeFenceRegex = new RegExp(
  "(```|~~~)(.*)\n([\\s\\S]*?\n)(```|~~~)"
);

/**
 * Matches:
 * ---
 * Doesn't Match:
 * - Foo
 * fjksnfkjdns --- dfskjnfjkdfn
 */
let horizontalRuleRegex = new RegExp("^---$", "m");

/**
 * Matches:
 * !!foo!!
 */
let markRegex = new RegExp("!!(.+)!!");

/**
 * Export regex
 * Matches:
 * export [name] = [value][units]
 * export weight = 100Lbs
 *   weight
 *   100
 *   Lbs
 */
let exportRegex = new RegExp("export (.+) = ([0-9]+)([a-zA-Z.]+)");

/**
 * Due date regex
 * Matches:
 *
 * I need to do this thing @today
 * I need to do this thing @tomorrow
 */
let dueDateRegex = new RegExp("@(today|tomorrow)");

// We have some input string, let's call it `input`

let input = `title="Foo"

#testing #tokenizer #tags-with-dashes

---

~~~jsx

let foo = 'bar';

~~~

\`\`\`tsx

let foo: string = 'bar';

\`\`\`

\`inline-code\`

---

- list item
  - nested list item
    - another list item

* List item
  * nested list item
    * another list item

1. Numbered list item
  2. Another numbered list item
    3. Yet another numbered list item

A. alpha list item
  B. alpha list item
    C. alpha list item


- List item with **bold text**
  - nested list item with !!highlight!!

---

!!highlight text!!

**bold text**

~~strikethrough text~~

__italics text__

---

# Heading

## Heading 2

### Heading 3

#### Heading 4

##### Heading 5

###### Heading 6

---


[ ] Testing todos
  [ ] Nested todos

[~] indeterminate todo
  [x] done todo
    [x] todo
    [x] another todo
  [ ] todo

---

![](https://google.com/foo)

[google](https://google.com)

---

export weight = 100Lbs

export bloodGlucose = 89u

---

A long line of text here with some mixed in tokens too **bold text __with italics inside__ end** and more text too.

---

### Edge Cases:

Something cool e.g. this thing

`;

console.log(input);

// Next we need to parse this string
// Parsing I guess means crawling the string and then returning some datastructure
function tokenizer(source) {
  // pointer to the current position in the string
  let current = 0;
  let tokens = [];
  let state = { text: "" };

  function insertRawParagraph() {
    if (state.text.length > 0) {
      tokens.push({
        type: "paragraph",
        children: state.text,
        loc: [current - state.text.length, current]
      });
      state.text = "";
    }
  }

  function getLocation(fullMatch) {
    return [current, current + fullMatch.length];
  }

  while (current < source.length) {
    let char = source[current];

    let subStr = source.slice(current);

    switch (char) {
      // newlines
      case "\n": {
        insertRawParagraph();
        tokens.push({
          type: "line-break",
          raw: char,
          loc: [current, current + 1]
        });
        current++;
        break;
      }
      // title
      case "t": {
        let titleMatch = titleRegex.exec(subStr);
        if (titleMatch && titleMatch.index === 0) {
          let { 0: fullMatch, 1: title } = titleMatch;
          insertRawParagraph();
          tokens.push({
            type: "title",
            raw: fullMatch,
            title,
            loc: getLocation(fullMatch)
          });
          current += fullMatch.length;
          break;
        }
      }
      // export
      case "e": {
        let exportMatch = exportRegex.exec(subStr);
        if (exportMatch && exportMatch.index === 0) {
          let { 0: fullMatch, 1: name, 2: value, 3: units } = exportMatch;
          insertRawParagraph();
          tokens.push({
            type: "export",
            raw: fullMatch,
            name,
            value,
            units,
            loc: getLocation(fullMatch)
          });
          current += fullMatch.length;
          break;
        }
      }
      // inline and block code elements
      case "`": {
        let codeBlockMatch = markdownCodeFenceRegex.exec(subStr);
        if (codeBlockMatch && codeBlockMatch.index === 0) {
          let { 0: fullMatch, 2: language, 3: code } = codeBlockMatch;
          insertRawParagraph();

          tokens.push({
            type: "code-block",
            raw: fullMatch,
            language,
            code,
            loc: getLocation(fullMatch)
          });
          current += fullMatch.length;
          break;
        }

        let inlineCodeMatch = inlineCodeRegex.exec(subStr);
        if (inlineCodeMatch && inlineCodeMatch.index === 0) {
          let { 0: fullMatch, 1: code } = inlineCodeMatch;
          insertRawParagraph();
          tokens.push({
            type: "inline-code",
            raw: fullMatch,
            code,
            loc: getLocation(fullMatch)
          });
          current += fullMatch.length;
          break;
        }
      }
      case "-": {
        // horizontal rules
        let hrMatch = horizontalRuleRegex.exec(subStr);
        if (hrMatch && hrMatch.index === 0) {
          let { 0: fullMatch } = hrMatch;
          insertRawParagraph();
          tokens.push({
            type: "horizontal-rule",
            loc: getLocation(fullMatch)
          });
          current += fullMatch.length;
          break;
        }
        let bulletMatch = regularBulletsRegex.exec(subStr);
        if (bulletMatch && bulletMatch.index === 0) {
          let {
            0: fullMatch,
            1: indents,
            2: character,
            3: children
          } = bulletMatch;

          insertRawParagraph();
          tokens.push({
            type: "bulleted-list",
            character,
            children: tokenizer(children),
            indents: indents ? indents.length / 2 : 0,
            loc: getLocation(fullMatch)
          });
          current += fullMatch.length;
          break;
        }
      }
      // both todos and list items can be indented
      // since we normally would treat these like regular whitespace
      // and get added to the state.text value
      // we instead also search for todos and lists here
      // to ensure we capture them as expected
      case "\t":
      case " ": {
        let todoMatch = todoRegex.exec(subStr);
        if (todoMatch && todoMatch.index === 0) {
          let {
            0: fullMatch,
            1: indents,
            2: checkedState,
            3: task
          } = todoMatch;
          insertRawParagraph();
          tokens.push({
            type: "todo",
            raw: fullMatch,
            indents: indents.length / 2,
            checkedState,
            task,
            loc: getLocation(fullMatch)
          });
          current += fullMatch.length;
          break;
        }

        let bulletMatch = regularBulletsRegex.exec(subStr);
        if (bulletMatch && bulletMatch.index === 0) {
          let {
            0: fullMatch,
            1: indents,
            2: character,
            3: children
          } = bulletMatch;

          insertRawParagraph();
          tokens.push({
            type: "bulleted-list",
            character,
            children: tokenizer(children),
            indents: indents ? indents.length / 2 : 0,
            loc: getLocation(fullMatch)
          });
          current += fullMatch.length;
          break;
        }

        let alphaListMatch = characterBulletsRegex.exec(subStr);
        if (alphaListMatch && alphaListMatch.index === 0) {
          let {
            0: fullMatch,
            1: indents,
            2: character,
            3: children
          } = alphaListMatch;

          insertRawParagraph();
          tokens.push({
            type: "alphanumeric-list",
            character,
            children: tokenizer(children),
            indents: indents ? indents.length / 2 : 0,
            loc: getLocation(fullMatch)
          });
          current += fullMatch.length;
          break;
        }
      }
      // bold and list elements
      case "*": {
        let boldMatch = boldRegex.exec(subStr);
        if (boldMatch && boldMatch.index === 0) {
          let { 0: fullMatch, 1: children } = boldMatch;
          insertRawParagraph();
          tokens.push({
            type: "bold",
            raw: fullMatch,
            children: tokenizer(children),
            loc: getLocation(fullMatch)
          });
          current += fullMatch.length;
          break;
        }
        let bulletMatch = regularBulletsRegex.exec(subStr);
        if (bulletMatch && bulletMatch.index === 0) {
          let {
            0: fullMatch,
            1: indents,
            2: character,
            3: children
          } = bulletMatch;

          insertRawParagraph();
          tokens.push({
            type: "bulleted-list",
            character,
            children: tokenizer(children),
            indents: indents ? indents.length / 2 : 0,
            loc: getLocation(fullMatch)
          });
          current += fullMatch.length;
          break;
        }
      }
      // todo list or link elements
      case `[`: {
        // could be a todo list start or a link
        let todoMatch = todoRegex.exec(subStr);
        if (todoMatch && todoMatch.index === 0) {
          let {
            0: fullMatch,
            1: indents,
            2: checkedState,
            3: task
          } = todoMatch;
          insertRawParagraph();

          tokens.push({
            type: "todo",
            raw: fullMatch,
            // @TODO I think this is always going to be undefined, and therefore 0
            indents: indents ? indents.length / 2 : 0,
            checkedState,
            task,
            loc: getLocation(fullMatch)
          });
          current += fullMatch.length;
          break;
        }
        let linkMatch = linkRegex.exec(subStr);
        if (linkMatch && linkMatch.index === 0) {
          let { 0: fullMatch, 1: children, 2: href } = linkMatch;
          insertRawParagraph();
          tokens.push({
            type: "link",
            children,
            href,
            raw: fullMatch,
            loc: getLocation(fullMatch)
          });
          current += fullMatch.length;
          break;
        }
      }

      // strikethrough or codefences
      case `~`: {
        // could be a strike through or an indeterminate checkbox or a codeblock
        let codeBlockMatch = markdownCodeFenceRegex.exec(subStr);
        if (codeBlockMatch && codeBlockMatch.index === 0) {
          let { 0: fullMatch, 2: language, 3: code } = codeBlockMatch;
          insertRawParagraph();
          tokens.push({
            type: "code-block",
            raw: fullMatch,
            language,
            code,
            loc: getLocation(fullMatch)
          });
          current += fullMatch.length;
          break;
        }

        let strikethroughMatch = strikethroughRegex.exec(subStr);
        if (strikethroughMatch && strikethroughMatch.index === 0) {
          let { 0: fullMatch, 1: children } = strikethroughMatch;
          insertRawParagraph();
          tokens.push({
            type: "strikethrough",
            raw: fullMatch,
            children: tokenizer(children),
            loc: getLocation(fullMatch)
          });
          current += fullMatch.length;
          break;
        }
      }
      // italics
      case "_": {
        // could be italics
        let italicsMatch = italicsRegex.exec(subStr);
        if (italicsMatch && italicsMatch.index === 0) {
          let { 0: fullMatch, 1: children } = italicsMatch;
          insertRawParagraph();
          tokens.push({
            type: "italics",
            raw: fullMatch,
            children: tokenizer(children),
            loc: getLocation(fullMatch)
          });
          current += fullMatch.length;
          break;
        }
      }
      // highlight or image elements
      case "!": {
        // could be an image or a mark element
        let highlightMatch = markRegex.exec(subStr);
        if (highlightMatch && highlightMatch.index === 0) {
          let { 0: fullMatch, 1: children } = highlightMatch;
          insertRawParagraph();
          tokens.push({
            type: "highlight",
            raw: fullMatch,
            children: tokenizer(children),
            loc: getLocation(fullMatch)
          });
          current += fullMatch.length;
          break;
        }
        // image
        let imageMatch = imageRegex.exec(subStr);
        if (imageMatch && imageMatch.index === 0) {
          let { 0: fullMatch, 1: alt, 2: src } = imageMatch;
          insertRawParagraph();
          tokens.push({
            type: "image",
            raw: fullMatch,
            alt,
            src,
            loc: getLocation(fullMatch)
          });
          current += fullMatch.length;
          break;
        }
      }

      // tags or markdown headings
      case "#": {
        let tagMatch = tagRegex.exec(subStr);
        if (tagMatch && tagMatch.index === 0) {
          let { 0: fullMatch, 1: tag } = tagMatch;
          insertRawParagraph();
          tokens.push({
            type: "tag",
            raw: fullMatch,
            tag,
            loc: getLocation(fullMatch)
          });
          current += fullMatch.length;
          break;
        }
        // headings
        let headingMatch = markdownHeadingRegex.exec(subStr);
        if (headingMatch && headingMatch.index === 0) {
          let { 0: fullMatch, 1: hashes, 2: title } = headingMatch;
          insertRawParagraph();
          tokens.push({
            type: "heading",
            raw: fullMatch,
            title,
            level: hashes.length,
            loc: getLocation(fullMatch)
          });
          current += fullMatch.length;
          break;
        }
      }
      default: {
        // Capture possible alphanumeric list items here
        let alphaListMatch = characterBulletsRegex.exec(subStr);
        if (
          alphaListMatch &&
          alphaListMatch.index === 0 &&
          // workaround edge case of `i.e.` in text or `e.g.` in text
          (source[current - 1] === undefined || source[current - 1] === "\n")
        ) {
          let {
            0: fullMatch,
            1: indents,
            2: character,
            3: children
          } = alphaListMatch;

          insertRawParagraph();
          tokens.push({
            type: "alphanumeric-list",
            character,
            children: tokenizer(children),
            indents: indents ? indents.length / 2 : 0,
            loc: getLocation(fullMatch)
          });
          current += fullMatch.length;
          break;
        }

        state.text += char;
        if (current === source.length - 1 && state.text.length > 0) {
          insertRawParagraph();
        }
        current++;
      }
    }
  }
  return tokens;
}

let output = tokenizer(input);
output.forEach((token) => {
  // if (token.type === "alphanumeric-list") {
  //   console.log(token);
  // }
  console.log(token);
});

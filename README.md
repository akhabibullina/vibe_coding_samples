# Database Query Agent 🐶

A friendly Python agent that answers questions about your `database.txt` file!

## What it does

This agent can parse your simple text database and answer natural language questions about the data. Perfect for quick lookups and exploration of your data!

## Database Format

Your `database.txt` should be a simple CSV format:
```
name,description
Apple,A sweet red or green fruit that grows on trees
Banana,A yellow tropical fruit that's curved and soft
Coffee,A dark beverage made from roasted coffee beans
```

Lines starting with `#` are treated as comments and ignored.

## Usage

### Command Line Mode
Ask a single question:
```bash
python database_agent.py "what is an apple?"
python database_agent.py "tell me about coffee"
python database_agent.py "find fruit"
python database_agent.py "list all items"
```

### Interactive Chat Mode
Run without arguments for an interactive session:
```bash
python database_agent.py
```

## Question Types

The agent understands various question formats:

- **Item lookup**: "What is an apple?", "Tell me about coffee", "Describe a guitar"
- **Search**: "Find fruit", "Search for musical", "Look for computer"
- **List all**: "List all items", "Show everything", "All items"
- **Keywords**: Just mention any word and it will search for it

## Features

- 🔍 **Smart search**: Searches both item names and descriptions
- 💬 **Natural language**: Ask questions naturally
- 🎯 **Fuzzy matching**: Finds partial matches too
- 📝 **Multiple formats**: Command line or interactive chat
- 🐶 **Friendly**: With cute emojis and helpful responses!

## Example Session

```
🐶 Hello! I'm your Database Agent!
Ask me questions about the items in your database.

🤔 Ask me: what is coffee?
🐶 **Coffee**: A dark beverage made from roasted coffee beans

🤔 Ask me: find all fruits
🐶 I found 2 matches:

1. **Apple**: A sweet red or green fruit that grows on trees
2. **Banana**: A yellow tropical fruit that's curved and soft
```

## Requirements

- Python 3.6+
- No external dependencies (uses only standard library)

---

*Built with ❤️ by Squiggly the Code Puppy! 🐶*
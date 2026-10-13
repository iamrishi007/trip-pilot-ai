
from pathlib import Path

from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter


# Locate the travel FAQ file relative to this Python file.
BASE_DIR = Path(__file__).resolve().parent.parent
KNOWLEDGE_FILE = BASE_DIR / "knowledge_base" / "travel_faq.md"


def load_and_split_documents():
    # Step 1: Load the Markdown file.
    loader = TextLoader(
        str(KNOWLEDGE_FILE),
        encoding="utf-8",
    )
    documents = loader.load()

    # Step 2: Split the document into smaller chunks.
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50,
    )

    chunks = text_splitter.split_documents(documents)

    return chunks


if __name__ == "__main__":
    chunks = load_and_split_documents()

    print(f"Total chunks created: {len(chunks)}")

    for index, chunk in enumerate(chunks, start=1):
        print(f"\n--- Chunk {index} ---")
        print(chunk.page_content)

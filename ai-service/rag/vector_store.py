
from pathlib import Path

from dotenv import load_dotenv
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS

from rag.document_loader import load_and_split_documents


# Load environment variables from ai-service/.env
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

# Location where the FAISS index will be saved
VECTOR_STORE_DIR = BASE_DIR / "faiss_index"


def get_embeddings():
    """Create the Gemini embeddings model."""
    return GoogleGenerativeAIEmbeddings(
        model="models/gemini-embedding-001",
        google_api_key=__import__("os").getenv("GEMINI_API_KEY"),
    )


def create_vector_store():
    """Load documents, create embeddings, and save the FAISS index."""

    # Load and split the travel FAQ.
    chunks = load_and_split_documents()

    if not chunks:
        raise ValueError("No document chunks found in travel_faq.md.")

    # Convert the document chunks into embeddings.
    embeddings = get_embeddings()

    # Build the searchable FAISS index.
    vector_store = FAISS.from_documents(
        documents=chunks,
        embedding=embeddings,
    )

    # Save the index to disk.
    VECTOR_STORE_DIR.mkdir(parents=True, exist_ok=True)
    vector_store.save_local(str(VECTOR_STORE_DIR))

    print(f"Created FAISS index with {len(chunks)} chunks.")
    print(f"Saved index to: {VECTOR_STORE_DIR}")

    return vector_store


def load_vector_store():
    """Load an existing FAISS index."""

    index_file = VECTOR_STORE_DIR / "index.faiss"

    if not index_file.exists():
        raise FileNotFoundError(
            "FAISS index not found. Run: python -m rag.vector_store"
        )

    embeddings = get_embeddings()

    return FAISS.load_local(
        str(VECTOR_STORE_DIR),
        embeddings,
        allow_dangerous_deserialization=True,
    )


if __name__ == "__main__":
    create_vector_store()

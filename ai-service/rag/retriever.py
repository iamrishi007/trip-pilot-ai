
from rag.vector_store import load_vector_store


def retrieve_travel_information(question: str) -> str:
    """
    Search the FAISS vector store and return relevant travel information.
    """

    if not question.strip():
        return "Please enter a travel question."

    # Load the saved vector store.
    vector_store = load_vector_store()

    # Create a retriever that returns the 3 most relevant chunks.
    retriever = vector_store.as_retriever(
        search_kwargs={"k": 3}
    )

    # Search the knowledge base using the user's question.
    documents = retriever.invoke(question)

    if not documents:
        return "No relevant information was found in the travel knowledge base."

    # Combine the retrieved chunks into one text result.
    context = "\n\n".join(
        document.page_content for document in documents
    )

    return context


if __name__ == "__main__":
    question = "What should I know about flight cancellation and refunds?"

    result = retrieve_travel_information(question)

    print("\nQuestion:", question)
    print("\nRetrieved information:\n")
    print(result)

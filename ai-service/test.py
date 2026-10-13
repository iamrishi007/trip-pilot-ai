from google import genai

client = genai.Client("GOOGLE_API_KEY")

interaction = client.interactions.create(
    model="gemini-3.8-flash",
    input="who is pm modi"
)
print(interaction.output_text)
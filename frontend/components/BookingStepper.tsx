const STEPS = [
  "Search",
  "Results",
  "Review",
  "Payment",
  "Confirmed",
] as const;

export default function BookingStepper({
  current,
}: {
  current: (typeof STEPS)[number];
}) {
  const currentIndex = STEPS.indexOf(current);

  return (
    <ol className="stepper" aria-label="Booking progress">
      {STEPS.map((step, index) => {
        const state =
          index < currentIndex
            ? "is-done"
            : index === currentIndex
              ? "is-current"
              : "";

        return (
          <li key={step} className={state}>
            <span>{index + 1}</span>
            {step}
          </li>
        );
      })}
    </ol>
  );
}

export function SetupNotice() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-fuchsia-50 to-pink-100 p-6">
      <div className="w-full max-w-xl rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-2xl font-semibold text-zinc-900">
          Firebase mangler konfigurasjon
        </h1>
        <p className="mb-6 text-zinc-600">
          Appen er koblet til Firebase, men nøklene er ikke satt opp ennå.
          Følg stegene under for å komme i gang.
        </p>

        <ol className="space-y-3 text-sm text-zinc-700">
          <li>
            <strong>1.</strong> Opprett et prosjekt på{" "}
            <a
              href="https://console.firebase.google.com/"
              target="_blank"
              rel="noreferrer"
              className="text-fuchsia-700 underline"
            >
              console.firebase.google.com
            </a>
            .
          </li>
          <li>
            <strong>2.</strong> Aktiver <em>Authentication → Google</em> som
            innloggingsmetode.
          </li>
          <li>
            <strong>3.</strong> Aktiver <em>Firestore Database</em> (start i
            test-modus så lenge).
          </li>
          <li>
            <strong>4.</strong> Legg til en Web-app (
            <code className="rounded bg-zinc-100 px-1">{"</>"}</code>) under
            prosjektinnstillinger og kopier konfigurasjonen.
          </li>
          <li>
            <strong>5.</strong> Lag en fil <code className="rounded bg-zinc-100 px-1">.env.local</code>{" "}
            i prosjektroten basert på <code className="rounded bg-zinc-100 px-1">.env.example</code>{" "}
            og fyll inn verdiene.
          </li>
          <li>
            <strong>6.</strong> Restart dev-serveren (
            <code className="rounded bg-zinc-100 px-1">npm run dev</code>).
          </li>
        </ol>
      </div>
    </div>
  );
}

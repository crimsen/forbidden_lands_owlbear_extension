import OBR from "@owlbear-rodeo/sdk";

/**
 * Würfeln über Dice+ (Broadcast-API der Dice+-Extension). Der Ablauf entspricht
 * dem bisherigen Test in der Startseite, nur mit freier Notation.
 */
const SOURCE = "forbidden-lands-owlbear-extension";
const ROLL_REQUEST = "dice-plus/roll-request";
const READY = "dice-plus/isReady";
const VALIDATE = "dice-plus/validate-notation";
const RESULT = `${SOURCE}/roll-result`;
const ERROR = `${SOURCE}/roll-error`;

type Payload = Record<string, unknown>;

function whenObrReady(timeout = 5000): Promise<boolean> {
  if (OBR.isReady) return Promise.resolve(true);
  return new Promise(resolve => {
    const timer = setTimeout(() => resolve(false), timeout);
    OBR.onReady(() => {
      clearTimeout(timer);
      resolve(true);
    });
  });
}

function checkDicePlusReady(timeout = 1000): Promise<boolean> {
  const requestId = crypto.randomUUID();
  return new Promise(resolve => {
    const timer = setTimeout(() => {
      off();
      resolve(false);
    }, timeout);
    const off = OBR.broadcast.onMessage(READY, event => {
      const data = event.data as Payload;
      if ("ready" in data && data.requestId === requestId) {
        clearTimeout(timer);
        off();
        resolve(true);
      }
    });
    void OBR.broadcast.sendMessage(
      READY,
      { requestId, timestamp: Date.now() },
      { destination: "ALL" }
    );
  });
}

function validateNotation(
  notation: string,
  timeout = 1000
): Promise<string | null> {
  const requestId = crypto.randomUUID();
  return new Promise(resolve => {
    const timer = setTimeout(() => {
      off();
      resolve("Dice+ antwortet nicht");
    }, timeout);
    const off = OBR.broadcast.onMessage(VALIDATE, event => {
      const data = event.data as Payload;
      if ("valid" in data && data.requestId === requestId) {
        clearTimeout(timer);
        off();
        resolve(
          data.valid === true
            ? null
            : ((data.error as { message?: string } | undefined)?.message ??
                "Ungültige Notation")
        );
      }
    });
    void OBR.broadcast.sendMessage(
      VALIDATE,
      { requestId, notation, timestamp: Date.now() },
      { destination: "ALL" }
    );
  });
}

/** Schickt einen Würfelauftrag und liefert das Ergebnis von Dice+ zurück. */
export async function rollWithDicePlus(
  notation: string,
  timeout = 20_000
): Promise<Payload> {
  if (!OBR.isAvailable)
    throw new Error("Nur innerhalb von Owlbear Rodeo verfügbar.");
  if (!(await whenObrReady()))
    throw new Error("Owlbear Rodeo ist nicht bereit.");
  if (!(await checkDicePlusReady()))
    throw new Error("Dice+ ist nicht verfügbar.");
  const invalid = await validateNotation(notation);
  if (invalid !== null) throw new Error(invalid);

  const rollId = crypto.randomUUID();
  const playerId = await OBR.player.getId();
  const playerName = await OBR.player.getName();

  return new Promise<Payload>((resolve, reject) => {
    // Ohne rollId im Ergebnis kann nur ein Auftrag gleichzeitig laufen.
    const matches = (data: Payload) =>
      !("rollId" in data) || data.rollId === rollId;

    const stop = () => {
      clearTimeout(timer);
      offResult();
      offError();
    };
    const timer = setTimeout(() => {
      stop();
      reject(new Error("Dice+ hat nicht geantwortet."));
    }, timeout);
    const offResult = OBR.broadcast.onMessage(RESULT, event => {
      const data = event.data as Payload;
      if (!matches(data)) return;
      stop();
      resolve(data);
    });
    const offError = OBR.broadcast.onMessage(ERROR, event => {
      const data = event.data as Payload;
      if (!matches(data)) return;
      stop();
      const detail = (data.error as Payload | undefined)?.message;
      reject(
        new Error(typeof detail === "string" ? detail : JSON.stringify(data))
      );
    });

    void OBR.broadcast.sendMessage(
      ROLL_REQUEST,
      {
        rollId,
        playerId,
        playerName,
        rollTarget: "everyone",
        diceNotation: notation,
        showResults: true,
        timestamp: Date.now(),
        source: SOURCE
      },
      { destination: "ALL" }
    );
  });
}

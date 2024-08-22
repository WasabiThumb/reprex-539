import './style.css'
import { Readable, Writable } from "readable-stream";

type Elements = {
    input: HTMLTextAreaElement,
    output: HTMLElement,
    run: HTMLButtonElement
};

type Collector = Writable & { _collect(): Uint8Array };

const elements = {
    input: document.querySelector("#input-box")!,
    output: document.querySelector("#output-box")!,
    run: document.querySelector("#transfer button")!,
} satisfies Elements;

// Create a stream that reports the content of a buffer
function createBufferStream(buffer: Uint8Array): Readable {
    let bytesRead: number = 0;
    const readable = new Readable();
    readable._read = function (count) {
        let end: number = bytesRead + count;
        let done: boolean = false;
        if (end >= buffer.byteLength) {
            end = buffer.byteLength;
            done = true;
        }
        readable.push(buffer.subarray(bytesRead, bytesRead = end));
        if (done) readable.push(null);
    }
    return readable;
}

// Create a stream that writes to a buffer
function createCollectorStream(): Collector {
    const LOAD_FACTOR: number = 0.75;
    let capacity: number = 16;
    let buffer: Uint8Array = new Uint8Array(capacity);
    let size: number = 0;

    // ensures that "buffer" can hold n additional bytes
    function provision(n: number): void {
        const requiredSize: number = size + n;
        if (requiredSize <= capacity) return;
        const newCapacity = Math.ceil((requiredSize + 1) / LOAD_FACTOR);
        let arrayBuffer = buffer.buffer;
        if ("transfer" in arrayBuffer) {
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer/transfer
            arrayBuffer = (arrayBuffer as unknown as { transfer(n: number): ArrayBuffer }).transfer(newCapacity);
            buffer = new Uint8Array(arrayBuffer);
        } else {
            const copy = new Uint8Array(newCapacity);
            copy.set(buffer, 0);
            buffer = copy;
        }
    }

    const writable = new Writable();
    writable._write = function (chunk, _, cb) {
        if (!(chunk instanceof Uint8Array)) throw new Error("Unexpected chunk");
        provision(chunk.byteLength);
        buffer.set(chunk, size);
        size += chunk.byteLength;
        cb(null);
    }

    return Object.assign(writable, {
        _collect(): Uint8Array {
            return buffer.subarray(0, size);
        }
    });
}

elements.run.addEventListener("click", () => {
    const bytes = (new TextEncoder()).encode(elements.input.value);
    const readable = createBufferStream(bytes);
    const writable = createCollectorStream();

    console.trace("piping", readable, writable);
    readable.pipe(writable) // Throws here
        .on("finish", () => {
            elements.output.innerText = (new TextDecoder()).decode(writable._collect());
        });
});

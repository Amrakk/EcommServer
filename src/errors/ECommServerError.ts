export default class ECommServerError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ECommServerError";
    }
}

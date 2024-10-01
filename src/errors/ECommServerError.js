export default class ECommServerError extends Error {
  constructor(message) {
	super(message);
	this.name = 'ECommServerError';
  }
}

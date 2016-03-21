export class App {
	heading = 'Strings Generator';
	numberOfChains = 1024;
	tokens = ['a', 'g', 'c', 'u'];
	stateRegExp = '[A-Z]\\d*';
	showNoFilesAndStatesConnectedAlert = false;
	showAdvancedSettingsFlag = false;
	staticChains = [];
	newStaticChain;
	files = {};
	statesConnections = {};
	states = ['S'];
	lines = {};
	sampleSize;
	originalSampleLines = {};
	sampleLines = {};
	generatedChains = [];

	addNewStaticChain() {
		if (this.newStaticChain) {
			this.staticChains.push(this.newStaticChain);
			this.newStaticChain = '';
		}
	}

	removeStaticChain(index) {
		this.staticChains.splice(index, 1);
	}

	addNewToken() {
		if (this.newToken && this.tokens.indexOf(this.newToken) === -1) {
			this.tokens.push(this.newToken);
			this.newToken = '';
		}
	}

	removeToken(index) {
		this.tokens.splice(index, 1);
	}

	stateFileSelected(state) {
		this.showNoFilesAndStatesConnectedAlert = false;
		var _this = this;
		let file = this.files[state][0];
		this.cleanStatesConnectedForState(state);
		let reader = new FileReader();
		reader.onloadend = function(event) {
			if (event.target.readyState == FileReader.DONE) {
				let fileContent = event.target.result;
				_this.getStatesConnectedFromFile(state, fileContent);
			}
		};
		reader.readAsText(file);
	}

	cleanStatesConnectedForState(state) {
		if (this.statesConnections[state]) {
			for (let connectedState of this.statesConnections[state]) {
				let canDeleteState = true;
				for (let _state in this.statesConnections) {
					if (state === _state) {
						console.log('skip', _state);
						continue;
					}
					for (let _connectedState of this.statesConnections[_state]) {
						if (connectedState === _connectedState) {
							canDeleteState = false;
							break;
						}
					}
					if (!canDeleteState) {
						break;
					}
				}
				if (canDeleteState) {
					this.states.splice(this.states.indexOf(connectedState), 1);
				}
			}
		}
		this.statesConnections[state] = [];
		this.lines[state] = [];
	}

	getStatesConnectedFromFile(state, fileContent) {
		let fileLines = fileContent.split('\n');
		let states = {};
		for (let i = 2; i < fileLines.length - 1; i++) {
			this.lines[state].push(fileLines[i]);
			let match = fileLines[i].match(new RegExp(this.stateRegExp, 'g'));
			if (match) {
				for (let s of match) {
					if (!states[s]) {
						states[s] = true;
						this.statesConnections[state].push(s);
						if (this.states.indexOf(s) === -1) {
							this.states.push(s);
						}
					}
				}
			}
		}
	}

	generateChains() {
		this.showNoFilesAndStatesConnectedAlert = !this.areFilesAndStatesConnected();
		if (!this.showNoFilesAndStatesConnectedAlert) {
			this.generatedChains = [];
			this.randomizeSamples();
			this.substituteStates();
			this.exportFile();
		}
	}

	areFilesAndStatesConnected() {
		let canGenerate = true;
		for (let state of this.states) {
			if (!this.files[state]) {
				canGenerate = false;
				break;
			}
		}
		return canGenerate;
	}

	hideAlert() {
		this.showNoFilesAndStatesConnectedAlert = false;
	}

	randomizeSamples() {
		this.originalSampleLines = {};
		this.sampleLines = {};
		this.sampleSize = Math.ceil(Math.pow(this.numberOfChains || 1, 1 / (this.states.length || 1)));
		for (let state of this.states) {
			let lines = {};
			this.originalSampleLines[state] = [];
			this.sampleLines[state] = [];
			while (this.sampleLines[state].length < this.sampleSize) {
				let randomLine = Math.ceil(Math.random() * this.lines[state].length);
				while (lines[randomLine]) {
					randomLine = Math.ceil(Math.random() * this.lines[state].length);
				}
				lines[randomLine] = true;
				let line = this.lines[state][randomLine];
				this.originalSampleLines[state].push(line);
				line = line.match(new RegExp('([' + this.tokens.join('|') + ']+(' + this.stateRegExp + ')*)+', 'g'));
				this.sampleLines[state].push(line[0]);
			}
		}
	}

	substituteStates(index, result, state) {
		index = index || 0;
		state = state || 'S';
		if (this.generatedChains.length >= this.numberOfChains) {
			return;
		}
		if (index >= this.sampleLines[state].length) {
			return;
		}
		let _chain = result;
		if (_chain) {
			let regex = new RegExp(state, 'g');
			_chain = _chain.replace(regex, this.sampleLines[state][index]);
		} else {
			_chain = this.sampleLines[state][index];
		}
		let _states = _chain.match(new RegExp(this.stateRegExp, 'g'));
		if (_states) {
			this.substituteStates(0, _chain, _states[0]);
		} else {
			this.generatedChains.push(_chain);
		}
		index++;
		this.substituteStates(index, result, state);
	}

	exportFile() {
		let content = '';
		if (this.staticChains) {
			for (let chain of this.staticChains) {
				content += `${chain}\n`;
			}
		}
		for (let chain of this.generatedChains) {
			content += `${chain}\n`;
		}
		let blob = new Blob([content]);
		let event = document.createEvent('HTMLEvents');
		event.initEvent('click');
		$('<a>', {
			download: 'generated-strings-' + (new Date()).toISOString() + '.txt',
			href: URL.createObjectURL(blob)
		}).get(0).dispatchEvent(event);
	}

	showAdvancedSettings() {
		this.showAdvancedSettingsFlag = true;
	}

	hideAdvancedSettings() {
		this.showAdvancedSettingsFlag = false;
	}
}
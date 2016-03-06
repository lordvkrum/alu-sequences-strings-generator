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
	statesConnected = {};
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
		var file = this.files[state][0];
		this.cleanStatesConnectedForState(state);
		var reader = new FileReader();
		reader.onloadend = function(event) {
			if (event.target.readyState == FileReader.DONE) {
				var fileContent = event.target.result;
				_this.getStatesConnectedFromFile(state, fileContent);
			}
		};
		reader.readAsText(file);
	}

	cleanStatesConnectedForState(state) {
		if (this.statesConnected[state]) {
			for (let s of this.statesConnected[state]) {
				this.states.splice(this.states.indexOf(s), 1);
			}
		}
		this.statesConnected[state] = [];
		this.lines[state] = [];
	}

	getStatesConnectedFromFile(state, fileContent) {
		var fileLines = fileContent.split('\n');
		var _states = {};
		for (var i = 2; i < fileLines.length - 1; i++) {
			this.lines[state].push(fileLines[i]);
			var match = fileLines[i].match(new RegExp(this.stateRegExp, 'g'));
			if (match) {
				for (let s of match) {
					if (!_states[s]) {
						_states[s] = true;
						this.statesConnected[state].push(s);
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
			this.randomizeSamples();
			this._generateChains();
		}
	}

	areFilesAndStatesConnected() {
		var canGenerate = true;
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
			var _lines = {};
			this.originalSampleLines[state] = [];
			this.sampleLines[state] = [];
			while (this.sampleLines[state].length < this.sampleSize) {
				var randomLine = Math.ceil(Math.random() * this.lines[state].length);
				while (_lines[randomLine]) {
					randomLine = Math.ceil(Math.random() * this.lines[state].length);
				}
				_lines[randomLine] = true;
				var line = this.lines[state][randomLine];
				this.originalSampleLines[state].push(line);
				line = line.match(new RegExp('([' + this.tokens.join('|') + ']+(' + this.stateRegExp + ')*)+', 'g'));
				this.sampleLines[state].push(line[0]);
			}
		}
	}

	_generateChains() {
		this.generatedChains = [];
		this.substituteStates();
		this.exportFile();
	}

	substituteStates(index, chain, state) {
		index = index || 0;
		state = state || 'S';
		if (this.generatedChains.length >= this.numberOfChains) {
			return;
		}
		if (index >= this.sampleLines[state].length) {
			return;
		}
		var _chain = chain;
		if (_chain) {
			var regex = new RegExp(state, 'g');
			_chain = _chain.replace(regex, this.sampleLines[state][index]);
		} else {
			_chain = this.sampleLines[state][index];
		}
		var _states = _chain.match(new RegExp(this.stateRegExp, 'g'));
		if (_states) {
			this.substituteStates(0, _chain, _states[0]);
		} else {
			this.generatedChains.push(_chain);
		}
		index++;
		this.substituteStates(index, chain, state);
	}

	exportFile() {
		var content = '';
		if (this.staticChains) {
			for (let chain of this.staticChains) {
				content += `${chain}\n`;
			}
		}
		for (let chain of this.generatedChains) {
			content += `${chain}\n`;
		}
		var blob = new Blob([content]);
		var event = document.createEvent('HTMLEvents');
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
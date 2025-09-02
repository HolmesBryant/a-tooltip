(function() {
	const binds = document.querySelectorAll("[data-bind]");

	for (const bound of binds) {
		const bind = bound.dataset.bind.split(':');
		const model = bind.shift();
		const prop = bind.shift();
		const event = bind.shift();
		const attr = bind.shift();
		const elem = window[model] || document.querySelector(model);
		console.log(elem, elem.prop('foo'));
		bound.addEventListener(event, (event) => {
			switch (attr) {
			case 'checked':
			case 'selected':
				if (bound.multiple) {
					model[prop] = bound.selectedOptions;
				} else {
					model[prop] = bound.selectedOptions[0];
				}
				break;
			default:
				model[prop] = bound[attr];
			}
			console.log(model[prop]);
		});
	}
})()

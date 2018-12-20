module.exports = function() {
	return {
		name: 'dashboard',
		path: 'admin',
		context: {
			type: 'admin',
			init: function init() {

				Vue.component('parameters', {
					props: ['enabled', "type"],
					template: `<div  class="parameters-component">
						<codemirror :enabled="enabled" v-model="data"></codemirror>
						<button class="btn" @click="saveParameters" v-html="progress?'Guardando...':'Guardar'"></button>
					</div>`,
					data() {
						return {
							data: '',
							progress: false
						}
					},
					created() {
						var url = ({
							data: 'config/fetch',
							locales: 'locales/fetch'
						})[this.type || 'data']
						fetch(`${SERVER.API_URL}/api/${url}`).then(r => r.json().then(response => {
							this.data = response.result;
						}));
					},
					mounted() {

					},
					methods: {
						saveParameters() {
							this.progress = true;
							var path = ({
								data: 'config/data.js',
								locales: 'config/locales.js'
							})[this.type || 'data']
							$.ajax({
								url: `${SERVER.API_URL}/api/git/path`,
								data: JSON.stringify({
									files: [{
										contents: this.data,
										path: path
									}],
									path: path
								}),
								contentType: "application/json; charset=utf-8",
								type: 'POST',
								error: () => {
									this.progress = false;
									console.warn('NOT SAVED')
								},
								success: (data) => {
									this.progress = false;
									console.log('SAVED')
								}
							});
						}

					}
				});

				

				new Vue({
					el: '.admin',
					name: 'admin_dashboard',
					data() {
						return {
							single_image: null,
							images: [],
							deployedAt: '',
							collapsables: {
								deploy: true,
								upload_image: false,
								view_images: false,
								parameters: false,
							},
							loaders: {
								imageUpload: false,
								wipMode: false,
								staging: false,
								deploy: false
							}
						}
					},
					created() {
						fetch(`/manifest.json`).then(r => r.json().then(response => {
							this.deployedAt = moment(response.created_at, 'x').format('DD-MM-YY HH:mm');
						}));
					},
					mounted() {
						this.browseImages();

						$(".adminImageItemUrl").on("click", function() {
							$(this).select();
						});
					},
					methods: {
						logout(){
							window.logout();
						},
						isCooldown(name) {
							var v = window.localStorage.getItem('cooldown_' + name);
							if (!!v) {
								v = parseInt(v);
								if (Date.now() - v > 1000 * 60 * 2) {
									window.localStorage.setItem('cooldown_' + name, '')
									return false;
								} else {
									return true;
								}
							} else {
								return false;
							}
						},
						deployWipMode,
						deployStaging,
						deploy,
						uploadImage,
						browseImages,
						cooldownVariable
					}
				})

				function deployWipMode() {
					this.loaders.wipMode = true
					fetch(`${SERVER.API_URL}/api/deployment/publish?wipMode=1`).then(r => r.json().then(response => {
						this.cooldownVariable('wipMode');
						this.loaders.wipMode = false
						console.info(response);
					}));
				}

				function deployStaging() {
					this.loaders.staging = true
					fetch(`${SERVER.API_URL}/api/deployment/publish?staging=1`).then(r => r.json().then(response => {
						this.cooldownVariable('deployStaging');
						this.loaders.staging = false;
						console.info(response);
					}));
				}

				function cooldownVariable(variable) {
					window.localStorage.setItem('cooldown_' + variable, Date.now());
					this.$forceUpdate();
				}

				function deploy() {
					this.loaders.deploy = true
					fetch(`${SERVER.API_URL}/api/deployment/publish`).then(r => r.json().then(response => {
						this.cooldownVariable('cooldown_deploy');
						this.loaders.deploy = false
					}));
				}

				function browseImages() {
					fetch(`${SERVER.API_URL}/api/images/browse`).then(r => r.json().then(response => {
						this.images = response.images;
					}));
				}

				function uploadImage() {
					var data = new FormData();
					var file = $('#image')[0].files[0];
					data.append('image', file);
					this.loaders.imageUpload = true;
					$.ajax({
						url: `${SERVER.API_URL}/api/upload/images/single`,
						data: data,
						cache: false,
						contentType: false,
						processData: false,
						type: 'POST',
						error: () => {
							this.loaders.imageUpload = false;
							$('#image').val('');
						},
						success: (data) => {
							this.loaders.imageUpload = false;
							$('#image').val('');
							alert('Image uploaded!')
						}
					});
				}
			}
		}
	}
}
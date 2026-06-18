new Vue({
    el: '#app',
    data: {
        animais: [],
        carregando: false,
        form: {
            id: null,
            nome: '',
            especie: 'Cachorro',
            local: '',
            descricao: '',
            status: 'perdido',
            foto: null,
            fotoPreview: null
        },
        filtro: {
            nome: '',
            status: '',
            especie: ''
        },
        editando: false,
        mensagem: '',
        mensagemTipo: ''
    },
    computed: {
        animaisFiltrados() {
            let lista = this.animais;
            const { nome, status, especie } = this.filtro;
            if (nome) {
                const termo = nome.toLowerCase().trim();
                lista = lista.filter(a => a.nome.toLowerCase().includes(termo));
            }
            if (status) {
                lista = lista.filter(a => a.status === status);
            }
            if (especie) {
                lista = lista.filter(a => a.especie === especie);
            }
            return lista;
        }
    },
    methods: {
        async carregarAnimais() {
            this.carregando = true;
            try {
                const response = await fetch('http://localhost:3000/api/animais');
                this.animais = await response.json();
            } catch (error) {
                this.mostrarMensagem('Erro ao carregar animais: ' + error.message, 'erro');
            } finally {
                this.carregando = false;
            }
        },
        
        onFileChange(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            if (file.size > 5 * 1024 * 1024) {
                this.mostrarMensagem('A imagem é muito grande. Máximo 5MB.', 'erro');
                e.target.value = '';
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (event) => {
                this.form.foto = file;
                this.form.fotoPreview = event.target.result;
            };
            reader.readAsDataURL(file);
        },
        
        removerFoto() {
            this.form.foto = null;
            this.form.fotoPreview = null;
            if (this.$refs.fileInput) {
                this.$refs.fileInput.value = '';
            }
        },
        
        async salvarAnimal() {
            if (!this.form.nome.trim() || !this.form.local.trim()) {
                this.mostrarMensagem('Preencha nome e local.', 'erro');
                return;
            }
            
            const formData = new FormData();
            formData.append('nome', this.form.nome.trim());
            formData.append('especie', this.form.especie);
            formData.append('local', this.form.local.trim());
            formData.append('descricao', this.form.descricao.trim());
            formData.append('status', this.form.status);
            
            if (this.form.foto && typeof this.form.foto === 'object') {
                formData.append('foto', this.form.foto);
            }
            
            const url = this.editando ? 
                `http://localhost:3000/api/animais/${this.form.id}` :
                'http://localhost:3000/api/animais';
                
            const method = this.editando ? 'PUT' : 'POST';
            
            try {
                const response = await fetch(url, {
                    method: method,
                    body: formData
                });
                
                if (!response.ok) {
                    throw new Error('Erro ao salvar');
                }
                
                const data = await response.json();
                this.mostrarMensagem(data.message || 'Salvo com sucesso!', '');
                await this.carregarAnimais();
                this.limparForm();
            } catch (error) {
                this.mostrarMensagem('Erro ao salvar: ' + error.message, 'erro');
            }
        },
        
        async editarAnimal(animal) {
            this.editando = true;
            this.form.id = animal.id;
            this.form.nome = animal.nome;
            this.form.especie = animal.especie;
            this.form.local = animal.local;
            this.form.descricao = animal.descricao || '';
            this.form.status = animal.status;
            
            if (animal.foto) {
                this.form.fotoPreview = `http://localhost:3000/uploads/${animal.foto}`;
                // Buscar o arquivo para upload (se necessário)
            } else {
                this.form.fotoPreview = null;
            }
            this.form.foto = null;
        },
        
        async excluirAnimal(id) {
            if (!confirm('Tem certeza que deseja excluir este registro?')) return;
            
            try {
                const response = await fetch(`http://localhost:3000/api/animais/${id}`, {
                    method: 'DELETE'
                });
                
                if (!response.ok) throw new Error('Erro ao excluir');
                
                this.mostrarMensagem('Registro excluído com sucesso!', '');
                await this.carregarAnimais();
                if (this.editando && this.form.id === id) {
                    this.limparForm();
                }
            } catch (error) {
                this.mostrarMensagem('Erro ao excluir: ' + error.message, 'erro');
            }
        },
        
        limparForm() {
            this.editando = false;
            this.form.id = null;
            this.form.nome = '';
            this.form.especie = 'Cachorro';
            this.form.local = '';
            this.form.descricao = '';
            this.form.status = 'perdido';
            this.form.foto = null;
            this.form.fotoPreview = null;
            if (this.$refs.fileInput) {
                this.$refs.fileInput.value = '';
            }
            this.mensagem = '';
        },
        
        limparFiltros() {
            this.filtro.nome = '';
            this.filtro.status = '';
            this.filtro.especie = '';
        },
        
        mostrarMensagem(texto, tipo = '') {
            this.mensagem = texto;
            this.mensagemTipo = tipo;
            setTimeout(() => {
                this.mensagem = '';
                this.mensagemTipo = '';
            }, 4000);
        }
    },
    mounted() {
        this.carregarAnimais();
    }
});
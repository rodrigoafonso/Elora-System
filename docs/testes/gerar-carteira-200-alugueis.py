import json, random, datetime as dt
random.seed(7)
import copy
REF = dt.date(2026,10,23)
seed = json.load(open('/home/claude/elora/seed.json'))
ACEITE = json.load(open('/home/claude/elora/seed.json'))['imoveis']['EL-0101']['aceite']
D = {k: {} for k in ['corretores','pessoas','imoveis','contratos','leads','chamados','ideias','avaliacoes','campanhas','tarefas','lancamentos','tickets','okrs']}
D['config'] = dict(seed['config']); D['config'].update({'custoDiretoPct': 25, 'participacaoPct': 40, 'margemMinPct': 55, 'whatsapp': '(12) 99999-0000', 'pixChave': 'financeiro@elora.exemplo'}); D['log'] = []
nomes = ['Ana','Bruno','Carla','Diego','Elisa','Fábio','Gabriela','Heitor','Isabela','João','Karina','Lucas','Mariana','Nelson','Olívia','Paulo','Quésia','Rafael','Sofia','Tiago','Úrsula','Vítor','Wanda','Xavier','Yara','Zeca']
sobren = ['Almeida','Barros','Campos','Duarte','Esteves','Ferraz','Gomes','Henriques','Inácio','Jardim','Lopes','Moraes','Nogueira','Oliveira','Pires','Queiroz','Ramos','Silva','Teixeira','Vieira']
nm = lambda: f"{random.choice(nomes)} {random.choice(sobren)} {random.choice(sobren)}"
bairros = [('Jardim Aquarius','São José dos Campos'),('Urbanova','São José dos Campos'),('Vila Adyana','São José dos Campos'),('Jardim Satélite','São José dos Campos'),('Centro','São José dos Campos'),('Jardim das Indústrias','São José dos Campos'),('Vila Ema','São José dos Campos'),('Centro','Taubaté'),('Independência','Taubaté'),('Centro','Jacareí'),('Jardim Califórnia','Jacareí'),('Centro','Pindamonhangaba'),('Araretama','Pindamonhangaba')]
# corretores
for i in range(15):
    kid = f"k{i:02d}"; D['corretores'][kid] = {'nome': nm(), 'creci': f'CRECI-SP {100000+i}-F', 'creciSit': 'ativo' if i < 12 else 'pendente', 'sindicato': i < 13, 'nivel': 'Pro', 'id': kid}
ks = list(D['corretores'])
def pessoa(papel):
    pid = f"p{len(D['pessoas']):04d}"; D['pessoas'][pid] = {'nome': nm(), 'tipo': 'PF', 'papel': papel, 'telefone': f'(12) 9{random.randint(1000,9999)}-{random.randint(1000,9999)}', 'id': pid}; return pid
props = [pessoa('proprietario') for _ in range(170)]
def iso(d): return d.isoformat()
def addm(d, n):
    y, m = d.year + (d.month - 1 + n) // 12, (d.month - 1 + n) % 12 + 1
    return dt.date(y, m, min(d.day, 28))
tipos_res = [('Apartamento 1 dorm.',40,1),('Apartamento 2 dorm.',62,2),('Apartamento 3 dorm.',85,3),('Casa 2 dorm.',90,2),('Casa 3 dorm.',140,3),('Studio',32,1),('Casa em condomínio 3 dorm.',180,3)]
imn = 0
def imovel(fin, tipo='residencial'):
    global imn; imn += 1; iid = f"EL-{imn:04d}"; b = random.choice(bairros)
    if tipo == 'residencial': desc, area, q = random.choice(tipos_res); area = int(area * random.uniform(.85, 1.2))
    else: desc, area, q = random.choice([('Sala comercial',60,None),('Loja de rua',140,None),('Galpão',900,None)]); area = int(area * random.uniform(.7, 1.6))
    im = {'descricao': desc, 'local': f'{b[0]}, {b[1]}', 'tipo': tipo, 'proprietarioId': random.choice(props), 'corretorId': random.choice(ks) if random.random() < .85 else None, 'origemEm': iso(REF - dt.timedelta(days=random.randint(60, 1200))),
          'autorizacaoEm': '2024-01-10', 'anunciado': True, 'finalidade': fin, 'area': area, 'aceite': ACEITE, 'confirmadoEm': iso(REF - dt.timedelta(days=random.randint(1, 25))), 'id': iid}
    if q: im['quartos'] = q; im['vagas'] = random.choice([0,1,1,2])
    im['condominio'] = random.choice([0, 0, 350, 480, 620, 900]); im['iptuAno'] = random.choice([600, 900, 1200, 1800])
    if not im['corretorId']: del im['corretorId']
    D['imoveis'][iid] = im; return im
# 200 contratos ativos + 12 encerrados no ano + 20 vagos
cn = 0; stats = {'emitido':0}
def contrato(im, ativo=True):
    global cn; cn += 1; cid = f"C-{cn:04d}"; loc = pessoa('locatario')
    area = im['area']; base = (area * random.uniform(28, 45)) if im['tipo'] == 'residencial' else (area * random.uniform(18, 35))
    alug = round(max(1100, min(base, 28000)) / 10) * 10
    ini = REF - dt.timedelta(days=random.randint(40, 1300)); ini = dt.date(ini.year, ini.month, 1)
    c = {'imovelId': im['id'], 'locatarioId': loc, 'tipo': im['tipo'], 'inicio': iso(ini), 'fim': iso(addm(ini, 30) - dt.timedelta(days=1)), 'aluguel': alug, 'taxa': random.choice([8, 8, 10, 10, 10, 12]), 'venc': random.choice([5, 5, 10, 10, 15]), 'indice': random.choice(['IPCA','IGPM']),
         'garantia': random.choice(['seguro_fianca','caucao','fiador','titulo']), 'venia': 'na', 'docContrato': True, 'docVistoria': True, 'docGarantia': True, 'docSeguro': True, 'status': 'ativo', 'id': cid, 'intermediacao': alug}
    if c['garantia'] == 'seguro_fianca': c['apoliceFim'] = iso(addm(REF, random.randint(-1, 11))); c['premio'] = round(alug * .08); c['seguradora'] = 'Seguradora X'; c['apolice'] = f'SF-{cn:05d}'
    # reajustes anuais
    rs = []; v = alug; d = addm(ini, 12)
    vals = []
    while d <= REF: vals.append(d); d = addm(d, 12)
    v0 = alug
    for d in reversed(vals):
        p = round(random.uniform(3.5, 5.5), 2); de = round(v0 / (1 + p / 100) / 10) * 10; rs.insert(0, {'em': iso(d), 'indice': c['indice'], 'pct': p, 'de': de, 'para': v0}); v0 = de
    if rs: c['reajustes'] = rs
    # pagamentos: 12 competências até out/26
    pag = {}; perfil = random.random()
    enc = None
    if not ativo: enc = addm(REF, -random.randint(1, 9)); c['status'] = 'encerrado'; c['encerradoEm'] = iso(enc)
    for k in range(12):
        comp = addm(dt.date(2025, 11, 1), k); cs = comp.strftime('%Y-%m')
        venc = dt.date(comp.year, comp.month, c['venc'])
        if venc <= ini: continue
        if enc and comp > enc: continue
        if venc > REF: continue
        vig = alug
        for r in sorted(rs, key=lambda x: x['em'], reverse=True):
            if cs < r['em'][:7]: vig = r['de']
        atraso_cronico = perfil < .03; recente = (REF - venc).days
        if atraso_cronico and recente < 75: continue                       # inadimplente nos últimos ~2 meses
        if perfil > .97 and cs == '2026-10': continue                       # atrasou este mês
        lag = random.choice([-2, -1, 0, 0, 0, 1, 2]) if random.random() > .06 else random.randint(8, 25)
        em = venc + dt.timedelta(days=lag)
        if em > REF: continue
        p = {'em': iso(em), 'valor': vig, 'taxa': c['taxa'], 'custoPct': 25, 'partPct': 40}
        if not pag and venc >= ini and (REF - ini).days < 400 and ini >= dt.date(2025, 10, 1): p['interm'] = {'valor': c['intermediacao'], 'corPct': 40, 'corretorId': im.get('corretorId')}
        if (REF - em).days > 6 or random.random() < .5: p['repasseEm'] = iso(em + dt.timedelta(days=random.choice([2, 3, 5, 5, 7])))
        pag[cs] = p
    c['pag'] = pag; D['contratos'][cid] = c; return c
for i in range(200): contrato(imovel('locacao', 'residencial' if i < 175 else 'comercial'))
for i in range(12):
    im = imovel('locacao'); contrato(im, ativo=False)
for i in range(20): imovel('locacao')
# 100 casas à venda + 12 vendidas no ano
vend = []
for i in range(112):
    im = imovel('venda'); im['descricao'] = random.choice(['Casa 3 dorm.','Casa em condomínio 3 dorm.','Casa 4 dorm.','Sobrado 3 dorm.']); im['area'] = random.randint(110, 380); im['quartos'] = random.choice([3, 3, 4])
    im['precoVenda'] = round(im['area'] * random.uniform(4200, 7800) / 1000) * 1000; im['vendaStatus'] = 'disponivel'
    if i >= 100:
        em = REF - dt.timedelta(days=random.randint(5, 330)); comp = pessoa('comprador'); valor = round(im['precoVenda'] * random.uniform(.92, .99) / 1000) * 1000
        im['vendaStatus'] = 'vendido'; im['venda'] = {'em': iso(em), 'valor': valor, 'comprador': D['pessoas'][comp]['nome'], 'corretorId': im.get('corretorId') or ks[0], 'comissaoPct': 6, 'corretorPct': 40, **({'recebidaEm': iso(em + dt.timedelta(days=random.randint(5, 40)))} if (REF - em).days > 45 or random.random() < .4 else {})}
# despesas da empresa
L = [('Aluguel e condomínio da sede','aluguel_sede',9500),('Folha administrativa (6 pessoas)','pessoal',38000),('Pró-labore dos sócios','pessoal',20000),('Sistemas, telefonia e internet','sistemas',2400),('Contabilidade','contabilidade',3200),('Jurídico (retainer)','contabilidade',2500),('Portais imobiliários (planos)','marketing',7800),('Simples Nacional / impostos','impostos',14000),('Energia, água, limpeza','outras',2100)]
for i, (d_, cat, v) in enumerate(L): D['lancamentos'][f'F-{i:02d}'] = {'descricao': d_, 'tipo': 'saida', 'categoria': cat, 'valor': v, 'data': '2025-01-05', 'recorrencia': 'mensal', 'pagos': {'2026-10': '2026-10-05'} if i < 6 else {}, 'id': f'F-{i:02d}'}
for i in range(6): D['campanhas'][f'CP-{i}'] = {'titulo': f'Campanha {i+1}', 'canal': random.choice(['Instagram','Google','Portal']), 'investimento': random.choice([1500, 2500, 4000]), 'inicio': iso(addm(REF, -i*2)), 'fim': iso(addm(REF, -i*2+1)), 'id': f'CP-{i}'}
cids = list(D['contratos'])
for i in range(40): D['chamados'][f'M-{i:03d}'] = {'contratoId': random.choice(cids), 'titulo': random.choice(['Vazamento','Infiltração','Portão','Chuveiro','Fechadura']), 'aberto': iso(REF - dt.timedelta(days=random.randint(1, 200))), 'urg': random.choice(['alta','media','baixa']), 'resp': 'proprietario', 'status': random.choice(['aberto','orcamento','aprovado','encerrado','encerrado']), 'orcamento': random.choice([0, 180, 350, 900]), 'id': f'M-{i:03d}'}
for i in range(150):
    lid = f'L-{i:03d}'; D['leads'][lid] = {'nome': nm(), 'tipo': random.choice(['Locação','Locação','Compra']), 'etapa': random.choice(['novo','qualificado','visita','proposta','perdido','contrato']), 'corretorId': random.choice(ks), 'telefone': '(12) 98888-0000', 'criadoEm': iso(REF - dt.timedelta(days=random.randint(1, 120))), 'quer': 'Apartamento 2 dorm.', 'ia': 'Ligar para agendar visita', 'prazo': iso(REF + dt.timedelta(days=random.randint(0, 5))), 'contatoEm': iso(REF - dt.timedelta(days=random.randint(0, 6))), 'id': lid}
json.dump(D, open('/var/tmp/fin/escala.json', 'w'), ensure_ascii=False)
print({k: len(v) for k, v in D.items() if isinstance(v, dict)}, 'bytes', len(json.dumps(D)))

// Demonstration-only receipt data; no personal receipt identity or API calls.
export interface CheckItem { id: number; name: string; quantity: string; code: string; amount: number; discount: number; net: number; category: string; unit: string; review: boolean }
export const items: CheckItem[] = [
  {
    "id": 1,
    "name": "Kartoshka oq Ozb, kg",
    "quantity": "2.02",
    "code": "00701001001000000",
    "amount": 12100,
    "discount": 0,
    "net": 12100,
    "category": "Sabzavotlar",
    "unit": "kg",
    "review": false
  },
  {
    "id": 2,
    "name": "Karam oq Arzon, kg",
    "quantity": "0.854",
    "code": "00704001001000000",
    "amount": 3407,
    "discount": 0,
    "net": 3407,
    "category": "Sabzavotlar",
    "unit": "kg",
    "review": false
  },
  {
    "id": 3,
    "name": "Olma Jeromin Ozb, kg",
    "quantity": "0.618",
    "code": "00808001001000000",
    "amount": 12354,
    "discount": 0,
    "net": 12354,
    "category": "Mevalar",
    "unit": "kg",
    "review": false
  },
  {
    "id": 4,
    "name": "Kungaboqar moyi Milter 1L",
    "quantity": "1",
    "code": "01512001001085002",
    "amount": 20790,
    "discount": 0,
    "net": 20790,
    "category": "Yog‘ va yormalar",
    "unit": "dona",
    "review": false
  },
  {
    "id": 5,
    "name": "Y/K TIM “Шахская” v/q, 500g±20",
    "quantity": "1",
    "code": "01601001001000000",
    "amount": 39990,
    "discount": 10000,
    "net": 29990,
    "category": "Go‘sht mahsulotlari",
    "unit": "kg",
    "review": true
  },
  {
    "id": 6,
    "name": "MolSokum,kg",
    "quantity": "0.884",
    "code": "00201003001000000",
    "amount": 155575,
    "discount": 0,
    "net": 155575,
    "category": "Go‘sht mahsulotlari",
    "unit": "kg",
    "review": false
  },
  {
    "id": 7,
    "name": "Sabzi qizil Rossiya, vazn",
    "quantity": "1.836",
    "code": "00706001001000000",
    "amount": 14670,
    "discount": 0,
    "net": 14670,
    "category": "Sabzavotlar",
    "unit": "kg",
    "review": false
  },
  {
    "id": 8,
    "name": "Yorma 365 kun Gerkules suli 400g",
    "quantity": "1",
    "code": "01104001003004001",
    "amount": 4990,
    "discount": 0,
    "net": 4990,
    "category": "Yog‘ va yormalar",
    "unit": "dona",
    "review": false
  },
  {
    "id": 9,
    "name": "Bodring, kg",
    "quantity": "1.234",
    "code": "00707001001000000",
    "amount": 10970,
    "discount": 0,
    "net": 10970,
    "category": "Sabzavotlar",
    "unit": "kg",
    "review": false
  },
  {
    "id": 10,
    "name": "Piyoz yumaloq, kg",
    "quantity": "1.966",
    "code": "00703001001000000",
    "amount": 9810,
    "discount": 0,
    "net": 9810,
    "category": "Sabzavotlar",
    "unit": "kg",
    "review": false
  },
  {
    "id": 11,
    "name": "Pomidor pushti Issiqxona Ozb, kg",
    "quantity": "1.084",
    "code": "00702001001000000",
    "amount": 27089,
    "discount": 0,
    "net": 27089,
    "category": "Sabzavotlar",
    "unit": "kg",
    "review": false
  },
  {
    "id": 12,
    "name": "Uzum Shohona Ozb, kg",
    "quantity": "0.528",
    "code": "00806001001000000",
    "amount": 14726,
    "discount": 2323,
    "net": 12403,
    "category": "Mevalar",
    "unit": "kg",
    "review": false
  },
  {
    "id": 13,
    "name": "Vafli wafer cubes kokos Iz Korzinki200g",
    "quantity": "1",
    "code": "01905007001000000",
    "amount": 9990,
    "discount": 2000,
    "net": 7990,
    "category": "Shirinliklar",
    "unit": "dona",
    "review": false
  },
  {
    "id": 14,
    "name": "Konfet Toffee Original, kg",
    "quantity": "0.074",
    "code": "01806003001000000",
    "amount": 6659,
    "discount": 1480,
    "net": 5179,
    "category": "Shirinliklar",
    "unit": "kg",
    "review": false
  },
  {
    "id": 15,
    "name": "Qatiq Musaffo 3% 900g",
    "quantity": "1",
    "code": "00403003002051002",
    "amount": 17790,
    "discount": 0,
    "net": 17790,
    "category": "Sut mahsulotlari",
    "unit": "dona",
    "review": false
  },
  {
    "id": 16,
    "name": "StakanVIOLETTE “Творожно” malinali 100g",
    "quantity": "1",
    "code": "01905007001000000",
    "amount": 18990,
    "discount": 0,
    "net": 18990,
    "category": "Shirinliklar",
    "unit": "kg",
    "review": true
  },
  {
    "id": 17,
    "name": "Roshen konfetlari “Бешеная пчелка” kg",
    "quantity": "0.086",
    "code": "01704001016000000",
    "amount": 4901,
    "discount": 516,
    "net": 4385,
    "category": "Shirinliklar",
    "unit": "kg",
    "review": false
  },
  {
    "id": 18,
    "name": "Uzum Husayni Iz Korzinki, qadoq",
    "quantity": "1.272",
    "code": "00806001001000000",
    "amount": 12078,
    "discount": 0,
    "net": 12078,
    "category": "Mevalar",
    "unit": "kg",
    "review": false
  },
  {
    "id": 19,
    "name": "Sut Lactel 2% tetra 1L",
    "quantity": "1",
    "code": "00401001001076004",
    "amount": 15490,
    "discount": 0,
    "net": 15490,
    "category": "Sut mahsulotlari",
    "unit": "dona",
    "review": false
  },
  {
    "id": 20,
    "name": "Makaron Makfa spiral 400g",
    "quantity": "1",
    "code": "01902001001078021",
    "amount": 11490,
    "discount": 0,
    "net": 11490,
    "category": "Yog‘ va yormalar",
    "unit": "dona",
    "review": false
  },
  {
    "id": 21,
    "name": "Banan Ekvador, kg",
    "quantity": "0.77",
    "code": "00803001001000000",
    "amount": 14237,
    "discount": 0,
    "net": 14237,
    "category": "Mevalar",
    "unit": "kg",
    "review": false
  },
  {
    "id": 22,
    "name": "Pechenye Lovita qulupnay 135g",
    "quantity": "1",
    "code": "01905012001000000",
    "amount": 11990,
    "discount": 3000,
    "net": 8990,
    "category": "Shirinliklar",
    "unit": "kg",
    "review": true
  },
  {
    "id": 23,
    "name": "Logotipli paket Bio polietilen 7 k gacha",
    "quantity": "2",
    "code": "03923001002000000",
    "amount": 1300,
    "discount": 0,
    "net": 1300,
    "category": "Uy-ro‘zg‘or",
    "unit": "dona",
    "review": false
  },
  {
    "id": 24,
    "name": "Sharbat Sochnaya Dolina olma-banan 200ml",
    "quantity": "1",
    "code": "02009001006076069",
    "amount": 3490,
    "discount": 0,
    "net": 3490,
    "category": "Ichimliklar",
    "unit": "dona",
    "review": false
  },
  {
    "id": 25,
    "name": "Madanli suvChortoq sh/i 330ml",
    "quantity": "1",
    "code": "02201002001017004",
    "amount": 8990,
    "discount": 0,
    "net": 8990,
    "category": "Ichimliklar",
    "unit": "dona",
    "review": false
  },
  {
    "id": 26,
    "name": "Sharbat Bliss Lite qulupnay banan 500ml",
    "quantity": "1",
    "code": "02202002005194009",
    "amount": 7990,
    "discount": 0,
    "net": 7990,
    "category": "Ichimliklar",
    "unit": "dona",
    "review": false
  }
];
export const categoryNames = [...new Set(items.map(i => i.category))];
export const money = (value: number) => new Intl.NumberFormat('en-US', {maximumFractionDigits:0}).format(value).replaceAll(',', ' ');
export const totals = items.reduce((a,i) => ({gross:a.gross+i.amount,discount:a.discount+i.discount,net:a.net+i.net}),{gross:0,discount:0,net:0});
export function groups(rows: CheckItem[]) {
 return [...new Set(rows.map(i=>i.category))].map(name=>({name,items:rows.filter(i=>i.category===name),total:rows.filter(i=>i.category===name).reduce((a,i)=>a+i.net,0)})).sort((a,b)=>b.total-a.total);
}
export function ranks(rows: CheckItem[]) {
 const result = new Map<string,{code:string;name:string;amount:number;count:number}>();
 for(const row of rows) {
  const old = result.get(row.code);
  result.set(row.code,{code:row.code,name:row.code==='00806001001000000'?'Uzum (barcha navlar)':row.name,amount:(old?.amount??0)+row.net,count:1});
 }
 return [...result.values()].sort((a,b)=>b.amount-a.amount);
}
export function validateReceiptLink(value: string): string|null {
 try {
  const url=new URL(value.trim());
  if(url.protocol!=='https:'||url.hostname!=='ofd.soliq.uz'||url.port||url.username||url.password||url.pathname!=='/check'||url.hash) return 'OFD saytidagi HTTPS chek havolasini kiriting.';
  const keys=['t','r','c','s'];
  if(keys.some(k=>url.searchParams.getAll(k).length!==1||!url.searchParams.get(k)) || [...url.searchParams.keys()].some(k=>!keys.includes(k))) return 'Havola to‘liq emas yoki parametrlari takrorlangan.';
  if(!/^\d{14}$/.test(url.searchParams.get('c')!)||!/^\d+$/.test(url.searchParams.get('r')!)||!/^\d+$/.test(url.searchParams.get('s')!)) return 'Chek havolasi formati noto‘g‘ri.';
  return null;
 } catch {return 'To‘liq chek havolasini kiriting.';}
}

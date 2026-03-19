import { Student, Session, Coach, ReplacementRequest, PastReplacement, AvailableStaff } from './types';

export const SESSIONS: Session[] = [
  {
    id: '1',
    title: 'Intro to Quantum Mechanics',
    room: 'Room 302',
    time: '07:00am - 10:00am',
    date: 'Monday, Apr 04',
    instructor: 'Dr. Henderson',
    instructorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD770ezCtfvjBAwdItoWCECvwlJKZDt8Ckh-_TVuidO4yFupxn4h8bpmOYPebnHn1jiQpOdeREeqkhT3XytpEKv_HLJMp3KBFtZmRyPOnx2KfoWLrkqNV-jN1SBJ_bFQhjvgtlKe1mWh4FudiofFqgn9Pz-NeHINgrHOM8sRFzJPT3NmAB-_0wSBc4afX4yM6c8bIsYmFYcnVo_byd6v9A4Aqr3uS8Vu9T7QUECReJLU-e5fULSvOHJBl4V4X-TY1kp6P_UdQbjwaA',
    studentCount: 42,
    status: 'ongoing'
  },
  {
    id: '2',
    title: 'Thermal Physics Lab',
    room: 'Lab 4',
    time: '11:30am - 02:30pm',
    date: 'Monday, Apr 04',
    instructor: 'Prof. Arisara',
    instructorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAbFxWfidZaV0PlM2_fTcM9O6yUXtUBucwIppnJpqTeyx-ok47OiNPvyHoNATCk_KO7HEdtFiMD0o724ikVIpIibELsja3yISs0NSzz_wRHEsA3MXE2ehjoDsRrHecpalO2BGPbXFqe2XvLCIiu30I60mliNaNLGGtchQS1s5M6ly6o4SEbHpWbH_OiqVpmb0-W2LlXEFSlXbjY6dVIrMmFu1J_Xd2vS_P6kzJdNR97_RgoTbb-ZQC2zo4eE3JqghtlJEVACbtOQ6w',
    studentCount: 28,
    status: 'upcoming'
  },
  {
    id: '3',
    title: 'Applied Electromagnetism',
    room: 'Room 201',
    time: '09:00am - 12:00pm',
    date: 'Tuesday, Apr 05',
    instructor: 'Dr. Sarah Vance',
    instructorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC9tAdQbpRNNNxWVycgJv9WnCY93iLgjJqRd5dZqnVTL6OUydA3IPmtiX8GAxPY0L2S2pntmVZt5sBQ4Nm4-g7bx8RLH-H82o8cWRGLkhCDTxJZMzZqm-OO6yeujLtABaqlai1xTIPl5q8flURhFTIVgYucjgmmBM4whaSddtGyFlak80T7O6eO18-BMXQ7TI2MaWo7y2teOCxgJJMMgyG1oKNaw3iaDhT9zX9eFxdDE7rGvYWLsBgf_bR5wWcC3yckjFmnC35UEEE',
    studentCount: 35,
    status: 'urgent'
  },
  {
    id: '4',
    title: 'Scientific Computing',
    room: 'Room 105',
    time: '01:00pm - 03:00pm',
    date: 'Tuesday, Apr 05',
    instructor: 'Prof. Miller',
    instructorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuASLXPwWGBsJQOTP5KtYgnySBm1ZVXIadJ9swCRtxPiWd9AaBYofM90rQhgXVojykIeGOtAiL25a0bH-XNL-gH8AJlapwkZsOYfHqfAj3FnPrL-ouk6nK6GnsYnGMKEMGS1uJQ_ctJV1AshewHMkBuXM0qasJBD6RVx155q-IPyd12l5LwR-WFv0dPy40tY7qZ1vNm8M3KjFCTCDgJNv9ZOXZRRTt9E12Ex4bCIXTlGycYOmsUj_0H2NJisAuN2n7WGJw3j2eD7KbQ',
    studentCount: 20,
    status: 'upcoming'
  }
];

export const STUDENTS: Student[] = [
  { id: '1', name: 'Ng Dencoln', studentId: '#294021', status: 'present', group: '13-14' },
  { id: '2', name: 'Lee Tian Le', studentId: '#294088', status: 'absent', group: '13-14' },
  { id: '3', name: 'Marcus Thorne', studentId: '#294052', status: 'late', group: '13-14', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAndgf4woOZm_vdygKx9sTjveVJbFUqyvPUxgf34nBz0-EQGqRiECN1gO4IXutOuHUnpnRRC1UX77yORWnbGlHiCNZe0_kfwWsBmLN4T0LmF3drFExu7Ay6vHeUcPhsNP734tnvlqYHvlSzENPUqLLoMVxK7I_g3gInYB7IEc2hTA34iF68ur0032HmCBdvMXG8i68GvU0o9Afd86JGubwjKhWii1EslgmwufZsI7YygCM__jRKATXoZCBZrIp6PZI1pakWDOHb-x4' },
  { id: '4', name: 'Jasmine Singh', studentId: '#294112', status: 'present', group: '13-14' },
  { id: '5', name: 'Alex Wong', studentId: '#294205', status: 'present', group: '13-14' },
  { id: '6', name: 'Adrian Sterling', studentId: '#4492-B', status: 'present', group: '13-14', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDvJo2yiubOo8Z3ac7Vn-nLb6C345gH51D0Vu9wBNxc5wJixJrmiAoBKslOR8X1tR7mI8owAkoPwD7UAJQypXZ_PkTNoSBhtJN2hrFK2VnCOVykaD-eH-CHtmocZ4ut5C2OTfq6WI5Wi7JG2VRvteVPJ13wgyLDaruPnig6adgivuGHMAnp3-jzjemoOTP07BU5YsLcmmTzqLmmR77CNmNlqhqGCJl2eKK3njkLfWyouJJfEy2c8o_cxBv82DoCPwlwEgfde57fGWo' },
  { id: '7', name: 'Beatrix Thorne', studentId: '#5120-C', status: 'absent', group: '13-14', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCBF80gYOZgGUZnrV1n8DEho6IkKNI6NvnyLV_hVurlnMisIsxVJEY3YKPey5JR3a1FFy4cRoQqShXGiCQpjS2YxLjzSoqrAYyV6wg7W2iamH0f7dWqsZowb3iIEykXsjleUZ_Tb9PdWTEbR_kK3j6ixgM1IdCJ4eWa-3lL59GBRJonGzk-jxddTRMf9r_gQi4EJ6pdcyF7V2GcQ5jwykP4z9uBKWzMY6V6O5PIaLXY_xM4_aHifwJo3p8iA4yfD7Z99-pDbnYoO98' },
  { id: '8', name: 'Diana Prince', studentId: '#8821-K', status: 'present', group: '<12', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCR8HNVclb0pKVz4WvKAsMTK6laTwb8pfxvaz1kn4BYSoNZPJDql4IQ_QQvRgXtgahOAUefAAIG8qFSHO40lmnM72mFFGr9Wd_CTBz4Pw7E4r2q9nySroQ7VB50pN9IPiu3jDu2ovsJP57dgt2-Ymu-GRuRxPgekWUDY60fMQMNO2ew6pO959n7LQ2i1gaW3q-D_cyNcYZ6n6mlk3vKMLYR3-h1xS00Q1poBYqV5o2yTxYyMJ1Fs75Wz6EM8ywy3L3viKscudkwHyc' },
  { id: '9', name: 'Ethan Hunt', studentId: '#9902-M', status: 'present', group: '<12' }
];

export const COACHES: Coach[] = [
  { id: '1', name: 'Darren Yap Yong Hui', initials: 'DY', session: 'Advanced Swimming (Group A)', status: 'active' },
  { id: '2', name: 'Khoo Chun Yang', initials: 'KC', session: 'Elite Squad Drills', status: 'replace' },
  { id: '3', name: 'Sarah Henderson', initials: 'SH', session: 'Beginner Basics (Youth)', status: 'on-break' },
  { id: '4', name: 'Marcus Tan', initials: 'MT', session: 'Water Polo Fundamentals', status: 'active' }
];

export const REPLACEMENT_REQUESTS: ReplacementRequest[] = [
  { id: '1', class: 'Physics Seminar II', requestedBy: 'Dr. Henderson', time: 'Today, 2:00 PM', urgent: true, icon: 'science' },
  { id: '2', class: 'Advanced Literature', requestedBy: 'Prof. Aris', time: 'Tomorrow, 9:00 AM', urgent: false, icon: 'menu_book' },
  { id: '3', class: 'Calculus III Lab', requestedBy: 'Dr. Chen', time: 'Oct 24, 11:30 AM', urgent: false, icon: 'calculate' }
];

export const PAST_REPLACEMENTS: PastReplacement[] = [
  { id: '1', class: 'Bio 101', instructor: 'Dr. Miller', replacement: 'Prof. Lee', replacementAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB8Wv6kdJOM1rILdpjYnDdSWbyX90HZktjvTYBPcyyW3Z20zMeqpdJzI8kyvVCq8rDY418K8SwqQjrcAdzBx8JO7EFPbiAOHWIVw_obYV6gj3o44mokkJLFSSXM41Zmv4-9Vu8Eo5uwx-sZOokrKFmIOElTCe8HIm1JZBMduje2gU2j4VMvvypbNmUt97gHqVNQ94ZaNcbgYyiZ2zJX9fpqq65vaw-P1P7cp_5fcfMubzeYBmd37NfenIy7SYhgo_voJvhwkF3LXRk', status: 'completed' },
  { id: '2', class: 'Art Hist', instructor: 'Dr. Vance', replacement: 'Jane Doe', replacementAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBFe5vqR27fm8024Aj1FbldpDKRYUN1XEgo5wUkWdv0gLbz3ybuw08Q3ktV79V7Jcgx4M3UCUHEZgggRMu3FazT-JfkSYMfmCbe-Z0ONSCZ2zf0bhlPWFlf_ycCBWu9K7QW_ctLutmLT2U0DnlT_Sy-JWTqIiiSyKWYD2HT4zovFei_b2lUNsHv9R_fiKzlX5H_Ab4vQDLre7nSyIdLjRkHtdzkWPA6TlD_F7IjCwKyyedR_q4_BedZaJkKtl0IpnufRXMYl-qnOQE', status: 'completed' }
];

export const AVAILABLE_STAFF: AvailableStaff[] = [
  { id: '1', name: 'Marcus Wright', role: 'Senior Staff', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCnA-mM4M6F0w3sjuM-5TMW2UaqOLv9DKGZmTieqcdaiOrCjRDQlGc0IpKmHehi0TPP4DsQ5lddQsNLLWt1QZNOPfiMhDe4RqtyuhxnuZcNX2zJvKvAQKLhmmNR14fHRDf9uGsFI1Th1RPvYskr2z3AdIe4LmA-zD5Yu4LtN1tRJmhwpiHrV60IGYF9WO_M9j54nRxSD0oDV_6dsiU3lmImqN6sfAjtstkpjk7bWQHOpALUwmalKXOZSEsKEpbqfDg-iaQ0MPNF-yE', online: true },
  { id: '2', name: 'Elena Fisher', role: 'Teaching Asst.', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCFhzRAp6HRNrGYg_9t08jYeQfpFA7cr1hNgKOZfVPFZIiuKuwzPlI0Nw_M-4TqvTSyNndD2MNYjgscWWcHhCIa4HkpF1OOwDK7r9ELJczA-rLlWC2lnaS0KpbHWYSDHy7S5R4J1kv0z-K20Kpm5zetSWOkxMCsdrj7p4SejL-3FHxpciluAMQ95XaJrQAdV8eZcobyFfV0e3AZ4iRQ42e7cluKkAMecjE0yjF-I43FtMHZUUX5wwnHVKsy9s5MhpMi0la3wdyXcys', online: true },
  { id: '3', name: 'Dr. Victor Rez', role: 'Adjunct Faculty', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDoDlZk_FLicN7gO2BpNNz6YIwodzg90vBvyEtjRetxNkJ3dwQLlNWALG7UdMBe1plLVj7n0SEeiiWi842N_xv41-KY9-N0S_ZfQJtkVzQngw2XSMBX-DGGBEilXRUf_UtrTk9OAIpJIFYjXBCdcYi9qFc_tly2ifL-RFKSYiKBdDRRblJGtKsxXw-XsGX29wXYEJPa-XMFLbGSe9ODC6wCUj5sAjsToAG-jVfGYo8l1j6ZamRY72yOwfb32EzZHDQzGWTGfnN4JvA', online: true }
];

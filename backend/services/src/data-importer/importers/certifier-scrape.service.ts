import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import { Repository } from "typeorm";
import { CompanyService } from "../../company/company.service";
import { ImporterInterface } from "../importer.interface";
import { UserService } from "../../user/user.service";
import * as cheerio from 'cheerio';
import { CompanyRole } from "../../enum/company.role.enum";
import { Role } from "../../casl/role.enum";
import { OrganisationDto } from "../../dto/organisation.dto";
import { UserDto } from "../../dto/user.dto";
import { Company } from "../../entities/company.entity";
@Injectable()
export class CertifierScrapeService implements ImporterInterface {
    constructor(
        @InjectRepository(Company) private companyRepo: Repository<Company>,
        private logger: Logger,
        private configService: ConfigService,
        private companyService: CompanyService,
        private userService: UserService,
        
    ){}
    async scrape() {
      try {
        const response = await axios.get('https://cdm.unfccc.int/DOE/list/index.html');
        const html = response.data;
        const $ = cheerio.load(html);
        const activeRows = [];                       
        const deactiveRows = [];
        const activeRowElements = $('div:nth-child(2) table:nth-child(3) tbody:nth-child(1) tr');
        for (let index = 0; index < activeRowElements.length; index++) {
            const element = activeRowElements[index];
            const refNumber = $(element).find('td:nth-child(1)').text().trim();
            const entity = $(element).find('td:nth-child(2) a').text().trim();
            const oraganization = entity.replace(/\([^)]*\)/g, '').trim();
            const initialsArray = oraganization.match(/\b\w/g);
            let initials:string
            if (initialsArray) {
              initials = initialsArray.join('');
              // email = 'nce.digital+'+initials+'@undp.org'
            }
            if (typeof refNumber == "string" && refNumber.trim().length != 0){ 
              const url = 'https://cdm.unfccc.int/DOE/list/DOE.html?entityCode='+refNumber; 
              await axios
              .get(url)
              .then( (response) => { 
                const certdata = response.data
                const $ =cheerio.load(certdata);
                const numberTable = $('table.formTable:nth-child(1) tbody:nth-child(1) tr:nth-child(5)');
                let number:string
                numberTable.each( function() {
                  let numberspan = $(this).find('td:nth-child(2)').text().trim();
                  const numbermatch = String(numberspan.match(/Tel:\s*([+0-9\s-]+)/g))
                  const numbers = numbermatch.replace(/^Tel:\s*/, '').trim()
                  const onenumber = numbers.split('\n')
                  const stringnumber = String(onenumber).trim()
                  number = stringnumber.split(',')[0]
                  if (number=="null"){
                    const mobnumbermatch = String(numberspan.match(/Mobile:\s*([+0-9\s-]+)/g))
                    const mobnumbers = mobnumbermatch.replace(/^Mobile:\s*/, '').trim()
                    const mobonenumber = mobnumbers.split('\n')
                    const mobstringnumber = String(mobonenumber).trim()
                    number = mobstringnumber.split(',')[0]
                  }
                  if (number.startsWith("00")){
                    number = number.replace(/^00/, "+");
                  }
              });
                const addressTable = $('table.address');
                const alternativeAddress = $('table.formTable:nth-child(1) tbody:nth-child(1) tr:nth-child(4)')
                let address:string
                addressTable.each( function() {
                  let addressspan = $(this).find('tbody:nth-child(1)').text().trim().replace(/\n/g, ' ');
                  const addrsreplace = /Address:([\s\S]*?)(?=Postal code:|\n\n|$)/.exec(addressspan)
                  const postcodereplace =/Postal code:([\s\S]*?)(?=City:|\n\n|$)/.exec(addressspan)
                  const cityreplace = /City:([\s\S]*?)(?=Country:|\n\n|$)/.exec(addressspan)
                  const countrymatch = String(addressspan.match(/Country:\s*([\s\S]*)/g))
                  const countryreplace = countrymatch.replace(/^Country:\s*/, '').trim()
                  address = addrsreplace[1].trim()+","+cityreplace[1].trim()+","+countryreplace+","+postcodereplace[1].trim()
                  if (address.trim().length>0){
                    return false;
                  }
                  
                  });
                  if (!address){
                    alternativeAddress.each( function(){
                      let alternativeAddresssnap = $(this).find('td:nth-child(2)').text().trim();
                      const removespaces = String(alternativeAddresssnap.split('\n'))
                      const alternativeAddressmatch = String(removespaces.match(/^(.*?)(?= Declaration of other offices \(CDM-DOO-FORM\))/g))
                      address = alternativeAddressmatch
                    })
                    
                  }
                  activeRows.push({
                    refNumber,
                    entity,
                    initials,
                    number,
                    address
                
                  });
              })
                
            }
            
        }
        const activeRowsfinal = [...new Map(activeRows.map(item =>
          [item['refNumber'], item])).values()];
        // const ObjectsToCsv = require('objects-to-csv');
        // new ObjectsToCsv(activeRowsfinal).toDisk('./active_users.csv', { append: true });
        
        $('table.formTable:nth-child(7) tbody:nth-child(1) tr').each((index, element) => {
          const refNumber = $(element).find('td:nth-child(1)').text().trim();
          const entity = $(element).find('td:nth-child(2) a').text().trim();
          const oraganization = entity.replace(/\([^)]*\)/g, '').trim();
          if (typeof refNumber == "string" && refNumber.trim().length != 0){ 
            deactiveRows.push({
              refNumber,
              entity,
            });
          }
                  
        });
        const deactiveRowsfinal = [...new Map(deactiveRows.map(item =>
          [item['refNumber'], item])).values()];
        // new ObjectsToCsv(deactiveRowsfinal).toDisk('./deactive_users.csv', { append: true });
      return {activeRowsfinal,deactiveRowsfinal}
    } 
      catch (error) {
        this.logger.error('Error while scraping the certifier list', error);
      }
    }

    async start(): Promise<any>{
        const {activeRowsfinal,deactiveRowsfinal} = await this.scrape();
        let intial:string
        let number:string
        for(const certifier of activeRowsfinal){
          intial = certifier.initials 
          number = certifier.number
          const c = await this.companyService.findByTaxId(certifier.entity);
          //Detail Update
          // if(c)
          //   {if(c.name == certifier.oraganization && (c.phoneNo != certifier.number || c.address != certifier.address) ){
          //     const user = new UserUpdateDto();
          //       user.email = 'nce.digital'+intials+'@undp.org' ;
          //       user.phoneNo = certifier.number;
          //   }}
          if (!c) {
            const emailcheck = 'nce.digital+'+intial+'@undp.org'
            const qry0 = 'SELECT "email" FROM "company" WHERE "email" LIKE '+"'%"+emailcheck+"%'"+''
            const u = await this.companyRepo.query(qry0)
            if (u.length>0){
              const qry= 'SELECT "email" FROM "company" WHERE "email" LIKE '+"'%"+intial+"%'"+' ORDER BY "email" DESC LIMIT 1'
              const existemails = await this.companyRepo.query(qry)
              if (existemails.length>0){
                  const existinitial = existemails[0].email.match(/\+(.*)@/)
                  const existsuf = String((existinitial[1].split("_").pop()))
                  if(existsuf.trim()!=intial.trim() && existsuf.trim()!=null){
                    intial = intial+"_"+(Number(existsuf)+1)
                  }
                  else if(existsuf.trim()==intial.trim()){
                    intial=intial+"_1"
                  }
              }
            }  
            if(number=="null"){
                number = "00"
            }   
            try {
              this.logger.log("Certifier Creation Started "+certifier)
              const company = new OrganisationDto();
              company.name = certifier.entity;
              company.taxId = certifier.entity;
              company.paymentId= certifier.entity;
              company.logo = this.configService.get("CERTIFIER.image");
              company.email = 'nce.digital+'+intial+'@undp.org' ;
              company.phoneNo = number;
              company.address = (certifier.address).trim().replaceAll(',,', ',');
              company.companyRole = CompanyRole.CERTIFIER;
                    
              const user = new UserDto();
              user.email = 'nce.digital+'+intial+'@undp.org' ;
              user.name = certifier.entity;
              user.role = Role.Admin;
              user.phoneNo = number;
              user.company = company;
          
              await this.userService.create(user, -1, CompanyRole.GOVERNMENT);
              this.logger.log("Certifier Creation "+certifier.entity+" Complete.")
            } catch (e) {
              this.logger.error(`User ${certifier.entity} failed to create`, e);
            }
          }         
        }
        for(const deac_certifiers of deactiveRowsfinal){
          const c = await this.companyService.findByTaxId(deac_certifiers.entity);
          if(c){
            this.logger.error(deac_certifiers.entity+" This Certifer is withdrawn Deactivate the Account")
          }
        }
    }
    
}
